import type { VaultFile } from '@so/core'
import { useTimer } from '@so/ui/useTimer'
import { type ComputedRef, computed, type Ref, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Credential, UnlockMethod, UnlockResult } from '../model'
import {
    isPinLocked,
    PIN_LENGTH,
    pinTriesLeft,
} from '../services/device/pinAttempts'
import { useVaultSession } from '../stores/useVaultSession'

// Lets the last dot paint before the PIN is judged.
const PIN_SETTLE_MS = 160

export interface UnlockContext {
    vault: ComputedRef<
        { id: string; location: string; methods: UnlockMethod[] } | undefined
    >
    // Null when the answer is stale: the page was left or another vault picked.
    attempt: (
        credential: Credential,
        copyOf?: (id: string) => Promise<VaultFile | undefined>,
    ) => Promise<UnlockResult | null>
    isStale: (forVault: string | undefined) => boolean
    succeed: () => void
    failedAttempts: Ref<number>
    picked: Ref<UnlockMethod | undefined>
    opening: Ref<boolean>
}

export function useUnlockPin({
    vault,
    attempt,
    succeed,
    failedAttempts,
    picked,
    opening,
}: UnlockContext) {
    const { t } = useI18n()
    const session = useVaultSession()
    const timer = useTimer()

    const pin = ref('')
    const pinError = ref('')
    // The wrong tries live with the slot: a reload or another page never resets them.
    const wrongPins = computed(
        () => session.device.get(vault.value?.id ?? '')?.pin?.wrong ?? 0,
    )
    const hasPin = computed(() => vault.value?.methods.includes('pin') ?? false)
    const pinLocked = computed(
        () => hasPin.value && isPinLocked(wrongPins.value),
    )
    const canUsePin = computed(() => hasPin.value && !pinLocked.value)

    function resetPin() {
        pin.value = ''
        pinError.value = ''
    }

    async function submitPin() {
        if (pin.value.length < PIN_LENGTH || opening.value) return
        const result = await attempt({ method: 'pin', pin: pin.value })
        if (result === null) return
        if (result === 'opened') return succeed()
        failedAttempts.value++
        pin.value = ''
        const triesLeft = pinTriesLeft(wrongPins.value)
        if (triesLeft === 0) {
            picked.value = 'pw'
            return
        }
        pinError.value =
            triesLeft === 1
                ? t('Wrong PIN. 1 try left, then the master password.')
                : t('Wrong PIN. {left} tries left, then the master password.', {
                      left: triesLeft,
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

    return {
        pin,
        pinError,
        pinLocked,
        canUsePin,
        resetPin,
        onPinInput,
        pressDigit,
        pressDelete,
        submitPin,
    }
}
