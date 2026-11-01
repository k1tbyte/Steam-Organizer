import { passwordSecretSlot, WrongPasswordError } from '@so/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

import { reportError } from '#core'

import type { PinState } from '../model'
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
            if (!done) return 'failed'
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

    return { pin, setPin, removePin }
})
