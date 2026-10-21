import { type AsyncStatus, useDesktopLayout } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMock } from '#core'

import { vaultsMock } from '../mocks'
import { LOCATION_ICON, type UnlockMethod } from '../model'
import { isPinLocked, PIN_LENGTH, pinTriesLeft } from '../services/pinAttempts'
import { useVaultSession } from '../stores/useVaultSession'

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
    const desktop = useDesktopLayout()
    const vaults = useMock(() => undefined, vaultsMock)
    const timer = useTimer()
    const pauseTimer = useTimer()

    const status = computed<AsyncStatus>(() =>
        vaults.value?.length ? 'ready' : 'empty',
    )

    const pickedVaultId = ref<string>()
    const vault = computed(
        () =>
            vaults.value?.find((item) => item.id === pickedVaultId.value) ??
            vaults.value?.[0],
    )
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
    const passwordPaused = ref(false)
    const waitingForHello = ref(false)
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

    function succeed() {
        opening.value = true
        timer.arm(OPENING_MS, session.open)
    }

    async function submitPin() {
        if (pin.value.length < PIN_LENGTH) return
        const ok = await session.verify({ method: 'pin', pin: pin.value })
        if (ok) return succeed()
        wrongPins.value++
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
        const ok = await session.verify({
            method: 'pw',
            password: password.value,
        })
        if (ok) return succeed()
        wrongPasswords.value++
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
        const forVault = vault.value?.id
        const ok = await session.verify({ method: 'bio' })
        waitingForHello.value = false
        // Hello approved the vault it was started for, not one picked meanwhile.
        if (ok && vault.value?.id === forVault) succeed()
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
        // Waits on the add-vault flow.
    }

    function removeFromDevice() {
        // Waits on vault storage.
    }

    function resetVault() {
        // Waits on the hold-to-reset flow.
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
        onPinInput,
        pressDigit,
        pressDelete,
        password,
        passwordError,
        submitPassword,
        waitingForHello,
        startHello,
        switchToPassword,
        switchToPin,
        addVault,
        removeFromDevice,
        resetVault,
    }
}
