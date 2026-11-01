import { deviceStore, type Sealed } from '@so/core'

import { reportError } from '#core'
import { forgetPlaced } from '../services/deviceSlots'
import {
    readActive,
    readKept,
    removeKept,
    watchKept,
    writeActive,
    writeKept,
} from '../services/keptEntry'
import {
    isIdle,
    keepsPastRestart,
    keepsSession,
    readSecuritySettings,
    timeoutMs,
} from '../services/lockPolicy'

const withKept = (
    slots: Parameters<Parameters<typeof deviceStore.update>[1]>[0],
    sealed?: Sealed,
) => {
    const { kept: _, ...rest } = slots
    return sealed ? { ...rest, kept: sealed } : rest
}

/** What the session found kept: a vault and its secret sealed under the device key. */
export interface KeptFound {
    vaultId: string
    sealed: Sealed
    /** Read from disk, not from the session area: the browser restarted. */
    onDisk: boolean
}

/** The session's keep half: holds the open vault's device-sealed secret and applies the lock policy to it (which
 *  area holds it, for how long), and finds it again after a reload or a restart. */
export function keptSession() {
    let held: { vaultId: string; sealed: Sealed } | null = null

    async function drop(vaultId = held?.vaultId) {
        try {
            await removeKept()
            if (vaultId)
                await deviceStore.update(vaultId, (slots) => withKept(slots))
        } catch (error) {
            reportError(error, 'vault-session')
        }
    }

    return {
        /** The ciphertext of the vault just opened; undefined (no device key) holds nothing. */
        hold(vaultId: string, sealed: Sealed | undefined) {
            held = sealed ? { vaultId, sealed } : null
        },
        release() {
            held = null
        },
        heldVault: () => held?.vaultId,
        drop,
        /** Removes a deleted vault's device slots, and the kept entry if it is that vault's. */
        async forget(vaultId: string) {
            try {
                if ((await readKept())?.vault === vaultId) await removeKept()
                await deviceStore.remove(vaultId)
                await forgetPlaced(vaultId)
            } catch (error) {
                reportError(error, 'vault-session')
            }
        },
        /** Puts the held ciphertext where the lock policy says: the session area, with the activity stamp for a
         *  timeout, and on disk for Never; Immediately keeps nothing. Run at an open and at a policy change. */
        async keep() {
            if (!held) return
            const { vaultId, sealed } = held
            const settings = readSecuritySettings()
            if (!keepsSession(settings)) return drop(vaultId)
            try {
                // The stamp first: a page restoring from the entry never finds one without it.
                if (timeoutMs(settings.lockAfter) !== null)
                    await writeActive(Date.now())
                await writeKept({ vault: vaultId, sealed })
                await deviceStore.update(vaultId, (slots) =>
                    withKept(
                        slots,
                        keepsPastRestart(settings) ? sealed : undefined,
                    ),
                )
            } catch (error) {
                reportError(error, 'vault-session')
            }
        },
        /** The kept session a page may restore: the session area's entry while the policy allows it, else after a
         *  restart the copy on disk. One past its timeout, or of a vault gone, is dropped. */
        async find(
            vaultIds: readonly string[],
            preferred?: string,
        ): Promise<KeptFound | undefined> {
            const settings = readSecuritySettings()
            const entry = await readKept()
            if (entry) {
                const alive =
                    vaultIds.includes(entry.vault) &&
                    keepsSession(settings) &&
                    !isIdle(settings, await readActive(), Date.now())
                if (alive)
                    return {
                        vaultId: entry.vault,
                        sealed: entry.sealed,
                        onDisk: false,
                    }
                await drop(entry.vault)
                return undefined
            }
            if (!keepsPastRestart(settings)) return undefined
            const onDisk = (await deviceStore.list()).filter(
                (slots) => slots.kept && vaultIds.includes(slots.vaultId),
            )
            const found =
                onDisk.find((slots) => slots.vaultId === preferred) ?? onDisk[0]
            return found?.kept
                ? { vaultId: found.vaultId, sealed: found.kept, onDisk: true }
                : undefined
        },
        read: readKept,
        watch: watchKept,
    }
}
