import {
    openSecretSlot,
    passwordSecretSlot,
    type RearmKind,
    type SecretSlot,
    type VaultKey,
    WrongPasswordError,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { reportError } from '#core'

import type { HelloState, PinState } from '../model'
import { dropSlot, forgetDevice } from '../services/device/deviceSlots'
import {
    enroll,
    enrollPrf,
    passkeysAvailable,
} from '../services/device/passkey'
import { isPinLocked } from '../services/device/pinAttempts'
import { enrollPin } from '../services/device/pinSlots'
import { useVaultSession } from './useVaultSession'

/** How the open vault opens on this device besides the master password. */
export const useVaultSecurity = defineStore('vault-security', () => {
    const session = useVaultSession()

    const facts = computed(() => {
        const id = session.vault?.id
        return id === undefined ? undefined : session.device.get(id)
    })

    const pin = computed<PinState>(() => {
        const slot = facts.value?.pin
        if (!slot) return 'off'
        return isPinLocked(slot.wrong) ? 'paused' : 'on'
    })

    // Whether this shell and device can make a passkey with PRF; asked once, the answer does not change.
    const available = ref(false)
    void passkeysAvailable().then((yes) => {
        available.value = yes
    })

    const hello = computed<HelloState>(() => {
        if (facts.value?.prf) return 'on'
        return available.value ? 'off' : 'unavailable'
    })

    // A vault removed while a prompt or a PBKDF2 ran must not keep the slots it just got.
    async function stillStored(id: string) {
        if (session.vaults.some((vault) => vault.id === id)) return true
        await forgetDevice(id).catch((error) =>
            reportError(error, 'vault-security'),
        )
        return false
    }

    /** Runs `work` with the slot the secret moves from, once the master password opens it (`wrong` otherwise). Any
     *  result but `ok` from `work` is returned as is. */
    async function enrolling<R extends string = never>(
        password: string,
        work: (
            id: string,
            key: VaultKey,
            from: SecretSlot,
        ) => Promise<'ok' | R>,
    ): Promise<'ok' | 'wrong' | 'failed' | R> {
        const id = session.vault?.id
        if (id === undefined) return 'failed'
        try {
            const result = await session.withKey(async (key, slots) =>
                work(
                    id,
                    key,
                    await passwordSecretSlot(slots.password, password),
                ),
            )
            if (result !== 'ok') return result ?? 'failed'
            if (!(await stillStored(id))) return 'failed'
        } catch (error) {
            if (error instanceof WrongPasswordError) return 'wrong'
            reportError(error, 'vault-security')
            return 'failed'
        }
        await session.refreshDevice([id])
        return 'ok'
    }

    async function dropping(kind: RearmKind) {
        const id = session.vault?.id
        if (id === undefined) return
        try {
            await dropSlot(id, kind)
        } catch (error) {
            reportError(error, 'vault-security')
        }
        await session.refreshDevice([id])
    }

    /** Sets or changes the PIN: the master password moves the secret under the PIN's key. `wrong`: that password. */
    const setPin = (password: string, value: string) =>
        enrolling(password, async (id, key, from) => {
            await enrollPin(id, key, from, value)
            return 'ok'
        })

    /** Removing asks nothing: it only takes a way in away. */
    const removePin = () => dropping('pin')

    /** Turns Hello on: the master password is checked first (it is the slot the secret moves from), then the platform
     *  asks the user once and a passkey's PRF output wraps the secret. `cancelled`: the prompt was closed. */
    async function enableHello(
        password: string,
    ): Promise<
        'ok' | 'wrong' | 'cancelled' | 'unavailable' | 'no-prf' | 'failed'
    > {
        // No open vault is 'failed', not 'unavailable'.
        if (session.vault && hello.value === 'unavailable') return 'unavailable'
        return enrolling(password, async (id, key, from) => {
            // Before the platform prompt: a wrong password never gets that far.
            await openSecretSlot(from)
            const made = await enroll(id)
            if (typeof made === 'string')
                return made === 'unsupported' ? 'unavailable' : made
            try {
                await enrollPrf(id, key, from, made.credentialId, made.bits)
            } finally {
                made.bits.fill(0)
            }
            return 'ok'
        })
    }

    /** Turning it off asks nothing. The passkey stays in the OS, unused. */
    const disableHello = () => dropping('prf')

    return { pin, setPin, removePin, hello, enableHello, disableHello }
})
