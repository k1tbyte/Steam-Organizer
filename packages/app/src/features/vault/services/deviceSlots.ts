import {
    deviceStore,
    deviceWrap,
    type Kdf,
    openRearm,
    type PinSlot,
    type PrfSlot,
    pinWrapFromBits,
    prfWrap,
    type RearmKind,
    resealSecretSlot,
    type Sealed,
    type SecretSlot,
    slotOf,
    type VaultKey,
} from '@so/core'

import { reportError } from '../../../core/reportError'
import { sessionArea } from '../../../core/session/sessionArea'
import type { SecuritySettings } from '../model'
import { readSecuritySettings } from './lockPolicy'

/** The secret sealed under this device's key, to keep it past a reload. Undefined where the device key is out of
 *  reach (storage denied): the vault opens anyway, it just is not kept. */
export async function sealForDevice(
    slot: SecretSlot,
): Promise<Sealed | undefined> {
    try {
        return await resealSecretSlot(slot, deviceWrap(await deviceStore.key()))
    } catch (error) {
        reportError(error, 'vault-session')
        return undefined
    }
}

/** The device slot a kept entry holds. */
export async function deviceSlotOf(sealed: Sealed): Promise<SecretSlot> {
    return slotOf(deviceWrap(await deviceStore.key()), sealed)
}

/** The slots only this device opens, wherever the lock policy puts them: on disk, or with Master password after
 *  restart in the session area (the extension) or in page memory (the web, which has no area bound to the browser's run). */
export interface Placed {
    pin?: PinSlot
    prf?: PrfSlot
}

type Home = 'disk' | 'area' | 'memory'

const memory = new Map<string, Placed>()
const areaKey = (vaultId: string) => `so:slots:${vaultId}`

const homeOf = ({ masterAfterRestart }: SecuritySettings): Home => {
    if (!masterAfterRestart) return 'disk'
    return sessionArea().restartBound ? 'area' : 'memory'
}

const only = ({ pin, prf }: Placed): Placed => ({
    ...(pin && { pin }),
    ...(prf && { prf }),
})

async function readAt(home: Home, vaultId: string): Promise<Placed> {
    if (home === 'disk') return only((await deviceStore.get(vaultId)) ?? {})
    if (home === 'memory') return only(memory.get(vaultId) ?? {})
    try {
        return only(
            JSON.parse((await sessionArea().get(areaKey(vaultId))) ?? '{}'),
        )
    } catch {
        return {}
    }
}

async function writeAt(home: Home, vaultId: string, placed: Placed) {
    const slots = only(placed)
    const empty = Object.keys(slots).length === 0
    if (home === 'disk')
        return deviceStore.update(vaultId, ({ pin: _, prf: __, ...rest }) => ({
            ...rest,
            ...slots,
        }))
    if (home === 'memory') {
        if (empty) memory.delete(vaultId)
        else memory.set(vaultId, slots)
        return
    }
    if (empty) await sessionArea().remove(areaKey(vaultId))
    else await sessionArea().set(areaKey(vaultId), JSON.stringify(slots))
}

/** One transition across pages: a Web Lock per vault is held over re-reading a slot, using it and saving it.
 *  Where there are no Web Locks (node tests) it runs directly. */
export function withSlotsLock<T>(vaultId: string, work: () => Promise<T>) {
    const locks = globalThis.navigator?.locks
    return locks ? locks.request(`so:slots:${vaultId}`, work) : work()
}

export const readPlaced = (
    vaultId: string,
    settings = readSecuritySettings(),
) => readAt(homeOf(settings), vaultId)

export async function changePlaced(
    vaultId: string,
    change: (placed: Placed) => Placed,
    settings = readSecuritySettings(),
) {
    const home = homeOf(settings)
    await writeAt(home, vaultId, change(await readAt(home, vaultId)))
}

/** Master password after restart changed: the slots follow it, with no PIN or passkey asked. */
export async function movePlaced(
    vaultIds: readonly string[],
    from: SecuritySettings,
    to: SecuritySettings,
) {
    const [was, now] = [homeOf(from), homeOf(to)]
    if (was === now) return
    for (const vaultId of vaultIds)
        await withSlotsLock(vaultId, async () => {
            await writeAt(now, vaultId, await readAt(was, vaultId))
            await writeAt(was, vaultId, {})
        })
}

/** A deleted vault leaves nothing here (`deviceStore.remove` drops the disk record). */
export async function forgetPlaced(vaultId: string) {
    memory.delete(vaultId)
    await sessionArea().remove(areaKey(vaultId))
}

/** After a master-password unlock: a PIN that was paused counts from zero, and a PIN or passkey a restart took
 *  (Master password after restart) is built again from the material sealed under `records`. `from` is the password slot. */
export async function armAfterPassword(
    vaultId: string,
    records: VaultKey,
    from: SecretSlot,
) {
    await withSlotsLock(vaultId, async () => {
        const settings = readSecuritySettings()
        const placed = await readPlaced(vaultId, settings)
        const rearm = (await deviceStore.get(vaultId))?.rearm
        const next: Placed = { ...placed }
        if (next.pin?.wrong) next.pin = { ...next.pin, wrong: 0 }
        if (settings.masterAfterRestart && !next.pin && rearm?.pin)
            next.pin = await rebuild(rearm.pin.bits, 'pin', async (key) => ({
                kdf: (rearm.pin as { kdf: Kdf }).kdf,
                key,
                wrong: 0,
            }))
        if (settings.masterAfterRestart && !next.prf && rearm?.prf)
            next.prf = await rebuild(rearm.prf.bits, 'prf', async (key) => ({
                credentialId: (rearm.prf as { credentialId: string })
                    .credentialId,
                key,
            }))
        if (JSON.stringify(next) !== JSON.stringify(placed))
            await changePlaced(vaultId, () => next, settings)
    })

    async function rebuild<T>(
        bits: Sealed,
        kind: RearmKind,
        slot: (sealed: Sealed) => Promise<T>,
    ): Promise<T | undefined> {
        try {
            const raw = await openRearm(records, kind, bits)
            try {
                const wrap = await (kind === 'pin'
                    ? pinWrapFromBits(raw)
                    : prfWrap(raw))
                return await slot(await resealSecretSlot(from, wrap))
            } finally {
                raw.fill(0)
            }
        } catch (error) {
            reportError(error, 'vault-session', { vault: vaultId })
            return undefined
        }
    }
}
