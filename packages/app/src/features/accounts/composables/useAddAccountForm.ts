import { useTimer } from '@so/ui/useTimer'
import { computed, type Ref, ref, type UnwrapNestedRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { detectSteamId, type SteamIdFormat, useMock } from '#core'

import { lookupMock } from '../mocks'
import { validateNewAccount } from '../services/newAccount'
import { useBanLabels } from './useBanLabels'
import { useVaultAccounts } from './useVaultAccounts'

const LOOKUP_MS = 900

/** The Add account flow: fields, Steam identifier detection, a simulated profile lookup, the maFile and the checks before Add. */
export function useAddAccountForm(open: Ref<boolean>) {
    const { t } = useI18n()
    const timer = useTimer()
    const { accounts } = useVaultAccounts()
    // The Steam profile has no source yet.
    const lookup = useMock(() => undefined, lookupMock)
    const banLabels = useBanLabels()

    const login = ref('')
    const password = ref('')
    const steamId = ref('')
    const maFileName = ref<string | null>(null)
    const lookingUp = ref(false)
    const looked = ref(false)

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
        maFileName.value = null
        lookingUp.value = false
        looked.value = false
    })

    const steamIdError = computed(() => checks.value.errors.steamId)

    return {
        login,
        password,
        steamId,
        maFileName,
        formatLabel: computed(() =>
            format.value ? formatLabels.value[format.value] : null,
        ),
        loginError: computed(() =>
            checks.value.errors.login ? t('Already in your vault') : undefined,
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
        canAdd: computed(() => checks.value.canAdd),
        attachMaFile: (files: File[]) => {
            maFileName.value = files[0]?.name ?? null
        },
        removeMaFile: () => {
            maFileName.value = null
        },
        // Saving waits on the vault: Add only closes the overlay for now.
        submit: () => {
            if (checks.value.canAdd) open.value = false
        },
    }
}

/** The form as the overlay hands it to its fields: refs unwrapped by `reactive`. */
export type AddAccountFormState = UnwrapNestedRefs<
    ReturnType<typeof useAddAccountForm>
>
