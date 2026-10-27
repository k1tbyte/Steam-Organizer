import { detectSteamId, type SteamIdFormat, toAccountId } from '@so/core'
import { useToast } from '@so/ui'
import { computed, type Ref, ref, type UnwrapNestedRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useCloseOnSuccess } from '#core'
import { useSteamApi, useSteamProblem } from '#features/steam'
import { useMaFile } from '#features/steam-guard'

import { validateNewAccount } from '../../services/newAccount'
import { bansOf, hueOf, steamYears } from '../../services/vaultAccounts'
import { useBanLabels } from '../useBanLabels'
import { type AddResult, useVaultAccounts } from '../useVaultAccounts'
import { useSteamLookup } from './useSteamLookup'

/** The Add account flow: fields, the Steam profile behind the identifier, the maFile and the checks before Add.
 *  An identifier waits for its profile; web cannot reach Steam, so it adds anonymous accounts, which need a name. */
export function useAddAccountForm(open: Ref<boolean>) {
    const { t } = useI18n()
    const { accounts, add } = useVaultAccounts()
    const toast = useToast()
    const closeOnSuccess = useCloseOnSuccess(open)
    const banLabels = useBanLabels()
    const linksSteam = useSteamApi().reachable
    const { openSteamSettings } = useSteamProblem()

    const login = ref('')
    const password = ref('')
    const steamId = ref('')
    const alias = ref('')
    // The name is flagged only once Add was tried without it.
    const tried = ref(false)
    const maFile = useMaFile(() => login.value)
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

    // Only a recognized identifier the vault does not hold yet is looked up.
    const lookup = useSteamLookup(() =>
        linksSteam &&
        format.value !== null &&
        checks.value.errors.steamId === null
            ? steamId.value.trim()
            : null,
    )
    const found = computed(() =>
        lookup.state.value.status === 'found' ? lookup.state.value : null,
    )

    // The flow starts clean on every opening, never on close: the sheet animates out with its content.
    watch(open, (isOpen) => {
        if (!isOpen) return
        login.value = ''
        password.value = ''
        steamId.value = ''
        alias.value = ''
        tried.value = false
        maFile.clear()
    })

    const steamIdError = computed(() => {
        if (refused.value === 'steam-taken') return 'taken'
        if (checks.value.errors.steamId) return checks.value.errors.steamId
        if (lookup.state.value.status === 'missing') return 'missing'
        const resolved = found.value && toAccountId(found.value.steamId)
        return resolved && existing.value.steamIds.includes(resolved)
            ? 'taken'
            : null
    })
    const nameMissing = computed(() => tried.value && checks.value.needsName)
    const canAdd = computed(
        () =>
            checks.value.canAdd &&
            !nameMissing.value &&
            refused.value === null &&
            (format.value === null ||
                (found.value !== null && steamIdError.value === null)) &&
            !maFile.picked.value?.problem &&
            !maFile.reading.value &&
            !saving.value,
    )

    return {
        login,
        password,
        steamId,
        alias,
        linksSteam,
        maFile: maFile.picked,
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
            if (steamIdError.value === 'missing')
                return t('Steam has no profile with this ID')
            return undefined
        }),
        steamIdHint: computed(() => {
            const { status } = lookup.state.value
            if (status === 'looking') return t('Looking up')
            return status === 'failed' ? t('Steam unavailable') : t('Optional')
        }),
        showLookingUp: computed(() => lookup.state.value.status === 'looking'),
        /** Why Steam could not answer: Add waits until a Retry or the key in Settings gets the profile. */
        problem: computed(() =>
            lookup.state.value.status === 'failed'
                ? lookup.state.value.problem
                : null,
        ),
        retryLookup: lookup.retry,
        openSteamSettings,
        profile: computed(() => {
            if (!found.value || steamIdError.value !== null) return undefined
            const { profile } = found.value
            const bans = bansOf(profile.bans)
            const level = t('Level {level}', { level: profile.level })
            const age =
                profile.registeredAt === null
                    ? []
                    : [t('{years}y', { years: steamYears(profile) })]
            const visibility = {
                public: t('public'),
                friends: t('friends only'),
                private: t('private'),
            }[profile.visibility]
            return {
                nickname: profile.nickname,
                hue: hueOf(found.value.steamId),
                avatar: profile.avatar,
                level: profile.level,
                clean: bans.length === 0,
                summary: [level, ...age, visibility].join(' · '),
                bans:
                    bans.length === 0
                        ? t('No bans')
                        : bans.map((kind) => banLabels.value[kind]).join(', '),
            }
        }),
        canAdd,
        saving,
        /** Empty Login and Steam ID fields take the file's; a file for another login gives nothing, and web shows no Steam ID field. */
        async attachMaFile(files: File[]) {
            const file = await maFile.attach(files[0])
            if (!file) return
            if (!login.value.trim()) login.value = file.accountName
            if (maFile.picked.value?.problem !== null) return
            if (linksSteam && !steamId.value.trim() && file.steamId)
                steamId.value = file.steamId
        },
        removeMaFile: maFile.clear,
        submit: () => {
            tried.value = true
            if (!canAdd.value) return
            const account = {
                login: login.value,
                password: password.value,
                steamId: found.value?.steamId ?? null,
                ...(found.value && { steam: found.value.profile }),
                alias: alias.value,
                authenticator:
                    maFile.picked.value?.problem === null
                        ? maFile.picked.value.file.authenticator
                        : undefined,
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
