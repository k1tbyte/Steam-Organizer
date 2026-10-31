import {
    DriveError,
    listCopies,
    readCopy,
    type StoredVault,
    type VaultFile,
} from '@so/core'
import { type AsyncStatus, useDesktopLayout } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { formatAgo, reportError, useMock } from '#core'
import { useDrive } from '#features/drive'

import { vaultsMock } from '../mocks'
import { type Credential, LOCATION_ICON, type UnlockMethod } from '../model'
import { isPinLocked, PIN_LENGTH, pinTriesLeft } from '../services/pinAttempts'
import { useVaultSession } from '../stores/useVaultSession'
import { useRemoveVault } from './useRemoveVault'

// Lets the last dot paint before the PIN is judged.
const PIN_SETTLE_MS = 160
// The success state shows while the vault opens.
const OPENING_MS = 700
const PASSWORD_TRIES_BEFORE_PAUSE = 5
const PASSWORD_PAUSE_MS = 30_000

const METHOD_ICON: Record<UnlockMethod, string> = {
    bio: 'icon-[lucide--fingerprint]',
    pin: 'icon-[lucide--grid-3x3]',
    pw: 'icon-[lucide--key-round]',
}

export function useUnlock() {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    const router = useRouter()
    const desktop = useDesktopLayout()
    // Read when the picker shows; the age needs no clock of its own here.
    function metaOf({ home, sync }: StoredVault) {
        if (!sync) return home === 'device' ? t('This device') : t('Folder')
        if (sync.syncedAt === null) return t('Google Drive')
        const ago = formatAgo(sync.syncedAt, Date.now()) ?? t('just now')
        return t('Google Drive · synced {ago}', { ago })
    }
    // Vaults on this device open with the master password only until PIN and Hello slots exist.
    const vaults = useMock(
        () =>
            session.vaults.map((item) => ({
                id: item.id,
                name: item.name,
                location: item.sync ? ('drive' as const) : item.home,
                meta: metaOf(item),
                methods: ['pw' as const],
            })),
        vaultsMock,
    )
    const timer = useTimer()
    const pauseTimer = useTimer()

    const status = computed<AsyncStatus>(() =>
        vaults.value?.length ? 'ready' : 'empty',
    )

    const pickedVaultId = ref(session.lastVaultId ?? undefined)
    const vault = computed(
        () =>
            vaults.value?.find((item) => item.id === pickedVaultId.value) ??
            vaults.value?.[0],
    )
    const resetOpen = ref(false)
    const removal = reactive(useRemoveVault(vault))
    const vaultRows = computed(() =>
        (vaults.value ?? []).map((item) => ({
            ...item,
            icon: LOCATION_ICON[item.location],
            active: item.id === vault.value?.id,
        })),
    )
    const vaultIcon = computed(() =>
        vault.value ? LOCATION_ICON[vault.value.location] : '',
    )
    const pickerOpen = ref(false)

    const pin = ref('')
    const pinError = ref('')
    const wrongPins = ref(0)
    const password = ref('')
    const passwordError = ref('')
    const wrongPasswords = ref(0)
    // Never resets: the fields shake on every change.
    const failedAttempts = ref(0)
    const passwordPaused = ref(false)
    const waitingForHello = ref(false)
    // The password is being checked, and after a refusal maybe against the Drive copy.
    const checkingPassword = ref(false)
    const opening = ref(false)
    const picked = ref<UnlockMethod>()

    watch(password, () => {
        if (!passwordPaused.value) passwordError.value = ''
    })

    function pickVault(id: string) {
        pickedVaultId.value = id
        pickerOpen.value = false
        pin.value = ''
        pinError.value = ''
    }

    const hasPin = computed(() => vault.value?.methods.includes('pin') ?? false)
    const hasBio = computed(() => vault.value?.methods.includes('bio') ?? false)
    const pinLocked = computed(
        () => hasPin.value && isPinLocked(wrongPins.value),
    )
    const canUsePin = computed(() => hasPin.value && !pinLocked.value)

    const methods = computed(() =>
        (vault.value?.methods ?? []).map((value) => ({
            value,
            icon: METHOD_ICON[value],
            label: {
                bio: t('Windows Hello'),
                pin: t('PIN'),
                pw: t('Password'),
            }[value],
            disabled: value === 'pin' && pinLocked.value,
        })),
    )

    // Desktop tabs: the picked one while it is allowed, else the first allowed.
    const method = computed<UnlockMethod>({
        get() {
            const allowed = methods.value.filter((item) => !item.disabled)
            return allowed.find((item) => item.value === picked.value)
                ? (picked.value as UnlockMethod)
                : (allowed[0]?.value ?? 'pw')
        },
        set(value) {
            picked.value = value
            pinError.value = ''
        },
    })
    // Phones have no tabs: the PIN pad while it works, the password otherwise, Hello is a key on the pad.
    const phoneMethod = computed<'pin' | 'pw'>(() =>
        canUsePin.value && picked.value !== 'pw' ? 'pin' : 'pw',
    )

    const view = computed<UnlockMethod | 'opening'>(() => {
        if (opening.value) return 'opening'
        return desktop.value ? method.value : phoneMethod.value
    })

    // A vault removed during the animation leaves the picker on another one: that one stays locked.
    function succeed() {
        const opened = vault.value?.id
        opening.value = true
        timer.arm(OPENING_MS, () => {
            if (vault.value?.id === opened) session.open()
            else opening.value = false
        })
    }

    // A linked vault's copy may carry a password changed on another device. Only a silent token: no Google window here.
    async function driveCopy(id: string): Promise<VaultFile | undefined> {
        const sync = session.vaults.find((item) => item.id === id)?.sync
        const email = drive.account.value?.email
        if (!sync || drive.state.value !== 'connected') return undefined
        if (sync.account !== null && sync.account !== email) return undefined
        try {
            return await drive.run(async (api) => {
                const [copy] = await listCopies(api, id)
                return copy && readCopy(api, copy.id)
            })
        } catch (error) {
            if (!(error instanceof DriveError)) reportError(error, 'vault')
            return undefined
        }
    }

    // An answer for a vault picked away meanwhile is dropped, with the key it unwrapped.
    async function attempt(credential: Credential) {
        const forVault = vault.value?.id
        let result = await session.unlock(credential, forVault)
        if (result === 'wrong' && credential.method === 'pw' && forVault) {
            const copy = await driveCopy(forVault)
            if (copy) result = await session.unlock(credential, forVault, copy)
        }
        if (vault.value?.id === forVault) return result
        if (result === 'opened') session.lock()
        return null
    }

    async function submitPin() {
        if (pin.value.length < PIN_LENGTH) return
        const result = await attempt({ method: 'pin', pin: pin.value })
        if (result === null) return
        if (result === 'opened') return succeed()
        wrongPins.value++
        failedAttempts.value++
        pin.value = ''
        const left = pinTriesLeft(wrongPins.value)
        if (left === 0) {
            picked.value = 'pw'
            return
        }
        pinError.value =
            left === 1
                ? t('Wrong PIN. 1 try left, then the master password.')
                : t('Wrong PIN. {left} tries left, then the master password.', {
                      left,
                  })
    }

    function onPinInput(next: string) {
        if (next === pin.value) return
        pin.value = next
        // A cleared pad is the reset after a wrong PIN: it keeps the message.
        if (next !== '') pinError.value = ''
        if (next.length === PIN_LENGTH) timer.arm(PIN_SETTLE_MS, submitPin)
    }

    function pressDigit(digit: string) {
        if (opening.value || pin.value.length >= PIN_LENGTH) return
        onPinInput(pin.value + digit)
    }

    function pressDelete() {
        if (opening.value) return
        pin.value = pin.value.slice(0, -1)
        pinError.value = ''
    }

    async function submitPassword() {
        if (password.value === '' || passwordPaused.value) return
        if (checkingPassword.value) return
        checkingPassword.value = true
        const result = await attempt({
            method: 'pw',
            password: password.value,
        }).finally(() => {
            checkingPassword.value = false
        })
        if (result === null) return
        if (result === 'opened') return succeed()
        if (result === 'unreadable') {
            passwordError.value = t(
                "Can't open this vault: the file is damaged or newer",
            )
            return
        }
        wrongPasswords.value++
        failedAttempts.value++
        if (wrongPasswords.value >= PASSWORD_TRIES_BEFORE_PAUSE) {
            passwordPaused.value = true
            passwordError.value = t('Too many attempts. Try again in 30 s.')
            pauseTimer.arm(PASSWORD_PAUSE_MS, () => {
                passwordPaused.value = false
                wrongPasswords.value = 0
                passwordError.value = ''
            })
            return
        }
        passwordError.value = t(
            'Wrong password. {left} attempts before a 30 s pause.',
            {
                left: PASSWORD_TRIES_BEFORE_PAUSE - wrongPasswords.value,
            },
        )
    }

    async function startHello() {
        if (waitingForHello.value) return
        waitingForHello.value = true
        const result = await attempt({ method: 'bio' })
        waitingForHello.value = false
        if (result === 'opened') succeed()
    }

    function switchToPassword() {
        picked.value = 'pw'
    }

    function switchToPin() {
        picked.value = 'pin'
        pin.value = ''
        pinError.value = ''
    }

    function addVault() {
        void router.push('/welcome')
    }

    function removeFromDevice() {
        pickerOpen.value = false
        removal.ask()
    }

    return {
        status,
        vault,
        vaultRows,
        vaultIcon,
        pickerOpen,
        pickVault,
        methods,
        method,
        view,
        hasBio,
        canUsePin,
        pinLocked,
        pin,
        pinError,
        failedAttempts,
        onPinInput,
        pressDigit,
        pressDelete,
        password,
        passwordError,
        checkingPassword,
        submitPassword,
        waitingForHello,
        startHello,
        switchToPassword,
        switchToPin,
        addVault,
        removeFromDevice,
        removal,
        resetOpen,
    }
}
