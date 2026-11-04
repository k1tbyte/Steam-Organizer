import type { Sealed } from '@so/core'

import { serialQueue } from '#core/serialQueue'
import { sessionArea } from '#core/session/sessionArea'
import { parseRecord } from '#core/storage'

const KEPT_KEY = 'so:kept'
// Apart from the entry: an activity write can never bring a removed entry back.
const ACTIVE_KEY = 'so:kept:active'

/** The open vault's secret sealed under the device key, in the session area: the one live signal that a session
 *  is open, under every policy. Its removal is a lock. */
export interface KeptEntry {
    vault: string
    sealed: Sealed
}

export async function readKept(): Promise<KeptEntry | undefined> {
    const raw = await sessionArea()
        .get(KEPT_KEY)
        .catch(() => undefined)
    const { vault, sealed } = parseRecord(raw)
    return typeof vault === 'string' && typeof sealed === 'string'
        ? { vault, sealed }
        : undefined
}

export const writeKept = (entry: KeptEntry) =>
    sessionArea().set(KEPT_KEY, JSON.stringify(entry))

export async function removeKept() {
    await sessionArea().remove(KEPT_KEY)
    await sessionArea().remove(ACTIVE_KEY)
    for (const key of await boundKeys()) await sessionArea().remove(key)
    await sessionArea().remove(BOUND_KEY)
}

// The keys of `sessionBound` values: the session area cannot list its keys.
const BOUND_KEY = 'so:kept:bound'
const bindInTurn = serialQueue()

async function boundKeys() {
    const raw = await sessionArea()
        .get(BOUND_KEY)
        .catch(() => undefined)
    return raw ? raw.split('\n') : []
}

/** Values that end with the open session: the lock that removes the entry, in whichever page, removes them, so a page
 *  asleep through a lock and an unlock never reads an old one back. */
export const sessionBound = {
    read: (key: string) => sessionArea().get(key),
    write: (key: string, value: string) =>
        bindInTurn(async () => {
            await sessionArea().set(key, value)
            const keys = await boundKeys()
            if (!keys.includes(key))
                await sessionArea().set(BOUND_KEY, [...keys, key].join('\n'))
        }),
}

/** When any page of the browser last saw activity. */
export async function readActive(): Promise<number | undefined> {
    const at = Number(await sessionArea().get(ACTIVE_KEY))
    return Number.isFinite(at) && at > 0 ? at : undefined
}

export const writeActive = (at: number) =>
    sessionArea().set(ACTIVE_KEY, String(at))

/** Calls `changed` whenever the entry is written or removed, by any page; read it again then. */
export const watchKept = (changed: () => void) =>
    sessionArea().watch(KEPT_KEY, changed)
