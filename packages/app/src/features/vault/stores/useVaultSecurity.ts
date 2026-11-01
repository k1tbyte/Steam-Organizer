import {
    openSecretSlot,
    passwordSecretSlot,
    WrongPasswordError,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { reportError } from '#core'

import type { HelloState, PinState } from '../model'
import { dropPrf, enrollPrf, forgetDevice } from '../services/deviceSlots'
import { enroll, passkeysAvailable } from '../services/passkey'
import { isPinLocked } from '../services/pinAttempts'
import { dropPin, enrollPin } from '../services/pinSlots'
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

    /** Sets or changes the PIN: the master password moves the secret under the PIN's key. `wrong`: that password. */
    async function setPin(
        password: string,
        value: string,
    ): Promise<'ok' | 'wrong' | 'failed'> {
        const id = session.vault?.id
        if (id === undefined) return 'failed'
        try {
            const done = await session.withKey(async (key, slots) => {
                const from = await passwordSecretSlot(slots.password, password)
                await enrollPin(id, key, from, value)
                return true
            })
            if (!done || !(await stillStored(id))) return 'failed'
        } catch (error) {
            if (error instanceof WrongPasswordError) return 'wrong'
            reportError(error, 'vault-security')
            return 'failed'
        }
        await session.refreshDevice([id])
        return 'ok'
    }

    /** Removing asks nothing: it only takes a way in away. */
    async function removePin() {
        const id = session.vault?.id
        if (id === undefined) return
        try {
            await dropPin(id)
        } catch (error) {
            reportError(error, 'vault-security')
        }
        await session.refreshDevice([id])
    }

    /** Turns Hello on: the master password is checked first (it is the slot the secret moves from), then the platform
     *  asks the user once and a passkey's PRF output wraps the secret. `cancelled`: the prompt was closed. */
    async function enableHello(
        password: string,
    ): Promise<'ok' | 'wrong' | 'cancelled' | 'unavailable' | 'failed'> {
        const id = session.vault?.id
        if (id === undefined) return 'failed'
        if (hello.value === 'unavailable') return 'unavailable'
        try {
            const result = await session.withKey(async (key, slots) => {
                const from = await passwordSecretSlot(slots.password, password)
                // Before the platform prompt: a wrong password never gets that far.
                await openSecretSlot(from)
                const made = await enroll(id)
                if (!made.ok)
                    return made.reason === 'unsupported'
                        ? 'unavailable'
                        : made.reason
                try {
                    await enrollPrf(
                        id,
                        key,
                        from,
                        made.value.credentialId,
                        made.value.bits,
                    )
                } finally {
                    made.value.bits.fill(0)
                }
                return 'ok'
            })
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

    /** Turning it off asks nothing. The passkey stays in the OS, unused. */
    async function disableHello() {
        const id = session.vault?.id
        if (id === undefined) return
        try {
            await dropPrf(id)
        } catch (error) {
            reportError(error, 'vault-security')
        }
        await session.refreshDevice([id])
    }

    return { pin, setPin, removePin, hello, enableHello, disableHello }
})
