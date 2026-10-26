import { useToast } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import { computed, type Ref, ref, type UnwrapNestedRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    detectSteamId,
    parseAccountId,
    reportError,
    type SteamIdFormat,
    toSteamId64,
    useCloseOnSuccess,
    useMock,
    usePlatform,
} from '#core'

import { lookupMock } from '../../mocks'
import { validateNewAccount } from '../../services/newAccount'
import { useBanLabels } from '../useBanLabels'
import { type AddResult, useVaultAccounts } from '../useVaultAccounts'

const LOOKUP_MS = 900

/** The Add account flow: fields, Steam identifier detection, a simulated profile lookup, the maFile and the checks before Add.
 *  Web cannot reach Steam: it adds anonymous accounts, which need a name. */
export function useAddAccountForm(open: Ref<boolean>) {
    const { t } = useI18n()
    const timer = useTimer()
    const { accounts, add } = useVaultAccounts()
    const toast = useToast()
    const closeOnSuccess = useCloseOnSuccess(open)
    // The Steam profile has no source yet.
    const lookup = useMock(() => undefined, lookupMock)
    const banLabels = useBanLabels()
    const linksSteam = usePlatform().kind !== 'web'

    const login = ref('')
    const password = ref('')
    const steamId = ref('')
    const alias = ref('')
    // The name is flagged only once Add was tried without it.
    const tried = ref(false)
    const maFileName = ref<string | null>(null)
    const lookingUp = ref(false)
    const looked = ref(false)
    const saving = ref(false)
    // What the vault refused on Add: a login only its tag matches, or one saved meanwhile.
    const refused = ref<Exclude<AddResult, 'added'> | null>(null)
    watch([login, steamId], () => {
        refused.value = null
    })

    const existing = computed(() => {
        return {
            logins: accounts.value.map((a) => a.login.toLowerCase()),
            steamIds: accounts.value.flatMap((a) =>
                a.steamId ? [a.steamId] : [],
            ),
        }
    })
    const checks = computed(() =>
        validateNewAccount(
            {
                login: login.value,
                password: password.value,
                steamId: steamId.value,
                alias: alias.value,
            },
            existing.value,
        ),
    )

    const formatLabels = computed<Record<SteamIdFormat, string>>(() => ({
        'account-id': t('Account ID'),
        steamid64: t('SteamID64'),
        steam2: t('Steam2'),
        steam3: t('Steam3'),
        'profile-url': t('Profile URL'),
        'friend-code': t('CS2 friend code'),
        'steam3-hex': t('Steam3 hex'),
        vanity: t('Vanity name'),
    }))
    const format = computed(() => {
        const detected = detectSteamId(steamId.value)
        return detected && detected !== 'unknown' ? detected : null
    })

    // Every edit restarts the lookup; only a recognized identifier starts one.
    watch(steamId, () => {
        timer.cancel()
        lookingUp.value = false
        looked.value = false
        if (format.value === null) return
        lookingUp.value = true
        timer.arm(LOOKUP_MS, () => {
            lookingUp.value = false
            looked.value = true
        })
    })

    // The flow starts clean on every opening, never on close: the sheet animates out with its content.
    watch(open, (isOpen) => {
        if (!isOpen) return
        timer.cancel()
        login.value = ''
        password.value = ''
        steamId.value = ''
        alias.value = ''
        tried.value = false
        maFileName.value = null
        lookingUp.value = false
        looked.value = false
    })

    const steamIdError = computed(() =>
        refused.value === 'steam-taken' ? 'taken' : checks.value.errors.steamId,
    )
    const nameMissing = computed(() => tried.value && checks.value.needsName)
    const canAdd = computed(
        () =>
            checks.value.canAdd &&
            !nameMissing.value &&
            refused.value === null &&
            !saving.value,
    )

    return {
        login,
        password,
        steamId,
        alias,
        linksSteam,
        maFileName,
        aliasHint: computed(() =>
            linksSteam ? t('Required without a Steam profile') : undefined,
        ),
        aliasError: computed(() => {
            if (!nameMissing.value) return undefined
            return linksSteam
                ? t('Add a name or a Steam profile')
                : t('Add a name')
        }),
        formatLabel: computed(() =>
            format.value ? formatLabels.value[format.value] : null,
        ),
        loginError: computed(() =>
            checks.value.errors.login || refused.value === 'login-taken'
                ? t('Already in your vault')
                : undefined,
        ),
        passwordError: computed(() =>
            checks.value.errors.password
                ? t('At least 6 characters')
                : undefined,
        ),
        steamIdMessage: computed(() => {
            if (steamIdError.value === 'unrecognized')
                return t('Unrecognized format')
            if (steamIdError.value === 'taken')
                return t('This Steam account is already in your vault')
            return undefined
        }),
        showLookingUp: computed(
            () => lookingUp.value && steamIdError.value === null,
        ),
        profile: computed(() => {
            const found = looked.value && steamIdError.value === null
            const profile = found ? lookup.value : undefined
            if (!profile) return undefined
            const visibility = {
                public: t('public'),
                friends: t('friends only'),
                private: t('private'),
            }[profile.visibility]
            return {
                nickname: profile.nickname,
                hue: profile.hue,
                level: profile.level,
                clean: profile.bans.length === 0,
                summary: t('Level {level} · {years}y · {visibility}', {
                    level: profile.level,
                    years: profile.years,
                    visibility,
                }),
                bans:
                    profile.bans.length === 0
                        ? t('No bans')
                        : profile.bans
                              .map((kind) => banLabels.value[kind])
                              .join(', '),
            }
        }),
        canAdd,
        saving,
        attachMaFile: (files: File[]) => {
            maFileName.value = files[0]?.name ?? null
        },
        removeMaFile: () => {
            maFileName.value = null
        },
        submit: () => {
            tried.value = true
            if (!canAdd.value) return
            const accountId = parseAccountId(steamId.value)
            const account = {
                login: login.value,
                password: password.value,
                steamId: accountId && toSteamId64(accountId),
                alias: alias.value,
            }
            saving.value = true
            return closeOnSuccess(async () => {
                try {
                    const result = await add(account)
                    if (result !== 'added') refused.value = result
                    return result === 'added'
                } catch (error) {
                    reportError(error, 'add-account')
                    toast.add({
                        color: 'danger',
                        title: t("Couldn't save the account"),
                    })
                    return false
                } finally {
                    saving.value = false
                }
            })
        },
    }
}

/** The form as the overlay hands it to its fields: refs unwrapped by `reactive`. */
export type AddAccountFormState = UnwrapNestedRefs<
    ReturnType<typeof useAddAccountForm>
>
