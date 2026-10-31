import { describe, expect, it } from 'vitest'

import {
    type AccountData,
    RECORD,
    type SteamSnapshot,
} from '../account/records'
import { openData, openSecret, sealRecord } from '../index'
import { mergeRecords, restampEdited } from './merge'
import type { SealedRecord } from './vault'
import { createVault } from './vault'

// One vault for the suite: creating one runs 600k PBKDF2 rounds.
const { key } = await createVault('correct horse')

const snapshot = (refreshedAt: number, level: number): SteamSnapshot => ({
    refreshedAt,
    nickname: 'nova_owl0',
    avatar: 'a1',
    level,
    badge: '',
    registeredAt: null,
    visibility: 'public',
    vanity: null,
    bans: {
        vac: 0,
        game: 0,
        community: false,
        economy: 'none',
        lastBanDays: null,
    },
    stats: null,
})

const account = (patch: Partial<AccountData> = {}): AccountData => ({
    kind: RECORD.ACCOUNT,
    steamId: '76561198000000001',
    tags: [],
    pinned: false,
    order: 'a0',
    addedAt: 1,
    editedAt: 1,
    guard: false,
    loginTag: 'tag',
    steam: snapshot(1, 10),
    ...patch,
})

const seal = (
    id: string,
    updatedAt: number,
    data: unknown,
    secret: unknown = { password: 'pw' },
    accountKey?: CryptoKey,
) => sealRecord(key, { id, updatedAt, data, secret }, accountKey)

const tomb = (id: string, updatedAt: number): SealedRecord => ({
    id,
    updatedAt,
    deleted: true,
})

/** `changes` written over `records`, as the session applies a merge. */
function apply(
    records: readonly SealedRecord[],
    changes: readonly SealedRecord[],
): SealedRecord[] {
    const byId = new Map(changes.map((record) => [record.id, record]))
    const next = records.map((record) => {
        const changed = byId.get(record.id)
        byId.delete(record.id)
        return changed ?? record
    })
    return [...next, ...byId.values()]
}

const dataOf = async (records: readonly SealedRecord[], id: string) => {
    const record = records.find((found) => found.id === id)
    if (!record || 'deleted' in record) return undefined
    return openData<AccountData>(key, record)
}

describe('merge by record', () => {
    it('takes a record only one side has: local-only asks for a push, remote-only lands', async () => {
        const mine = await seal('mine', 1, { kind: RECORD.TAG, label: 'a' })
        const theirs = await seal('theirs', 1, { kind: RECORD.TAG, label: 'b' })
        expect(await mergeRecords(key, [mine], [])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        expect(await mergeRecords(key, [], [theirs])).toEqual({
            toLocal: [theirs],
            toRemote: false,
        })
    })

    it('changes nothing for identical records and identical tombstones', async () => {
        const tag = await seal('t', 3, { kind: RECORD.TAG, label: 'a' })
        expect(
            await mergeRecords(
                key,
                [tag, tomb('gone', 2)],
                [structuredClone(tag), tomb('gone', 2)],
            ),
        ).toEqual({ toLocal: [], toRemote: false })
    })

    it('lets the newer side win against a tombstone, and the tombstone win a tie', async () => {
        const live = await seal('a', 5, account())
        expect(await mergeRecords(key, [live], [tomb('a', 4)])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        expect(await mergeRecords(key, [live], [tomb('a', 6)])).toEqual({
            toLocal: [tomb('a', 6)],
            toRemote: false,
        })
        expect(await mergeRecords(key, [live], [tomb('a', 5)])).toEqual({
            toLocal: [tomb('a', 5)],
            toRemote: false,
        })
        expect(await mergeRecords(key, [tomb('a', 5)], [live])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        expect(await mergeRecords(key, [tomb('a', 3)], [tomb('a', 4)])).toEqual(
            { toLocal: [tomb('a', 4)], toRemote: false },
        )
    })

    it('lets the newer record win when no halves apply, and the remote one a tie', async () => {
        const older = await seal('t', 1, { kind: RECORD.TAG, label: 'old' })
        const newer = await seal('t', 2, { kind: RECORD.TAG, label: 'new' })
        expect(await mergeRecords(key, [newer], [older])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        const tied = await seal('t', 1, { kind: RECORD.TAG, label: 'tied' })
        expect(await mergeRecords(key, [tied], [older])).toEqual({
            toLocal: [older],
            toRemote: false,
        })
    })

    it('keeps a note edited on one side and a bulk refresh on the other', async () => {
        const edited = await seal(
            'a',
            5,
            account({ note: 'new note', editedAt: 5 }),
            { password: 'edited' },
        )
        const refreshed = await seal(
            'a',
            9,
            account({ steam: snapshot(9, 42) }),
        )
        const one = await mergeRecords(key, [edited], [refreshed])
        const two = await mergeRecords(key, [refreshed], [edited])
        for (const merged of [one, two]) {
            const [record] = merged.toLocal
            if (!record || 'deleted' in record) throw new Error('no merge')
            expect(merged.toRemote).toBe(true)
            expect(record.updatedAt).toBe(9)
            const data = await dataOf(merged.toLocal, 'a')
            expect(data?.note).toBe('new note')
            expect(data?.steam?.level).toBe(42)
            // The secret goes with the user's side.
            expect(await openSecret(key, record)).toEqual({
                password: 'edited',
            })
        }
    })

    it('takes a side whole when the result is that side', async () => {
        const edited = await seal(
            'a',
            5,
            account({ note: 'n', editedAt: 5, steam: snapshot(9, 42) }),
        )
        const stale = await seal('a', 6, account({ steam: snapshot(2, 1) }))
        expect(await mergeRecords(key, [edited], [stale])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        expect(await mergeRecords(key, [stale], [edited])).toEqual({
            toLocal: [edited],
            toRemote: false,
        })
    })

    it("carries a locked account's secret without its key", async () => {
        const accountKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
        )
        const lock = {
            scope: 'credentials' as const,
            slots: {} as never,
        }
        const edited = await seal(
            'a',
            5,
            account({ alias: 'Main', editedAt: 5, lock }),
            { password: 'locked' },
            accountKey,
        )
        const refreshed = await seal(
            'a',
            9,
            account({ lock, steam: snapshot(9, 42) }),
            { password: 'locked' },
            accountKey,
        )
        const { toLocal } = await mergeRecords(key, [refreshed], [edited])
        const [record] = toLocal
        if (!record || 'deleted' in record) throw new Error('no merge')
        expect(record.secret).toBe(edited.secret)
        expect(await openSecret(key, record, accountKey)).toEqual({
            password: 'locked',
        })
        const data = await dataOf(toLocal, 'a')
        expect([data?.alias, data?.steam?.level]).toEqual(['Main', 42])
    })

    it('merges an everything-locked account whole, by the later user edit, then by its stamp', async () => {
        const lock = { scope: 'everything' as const, slots: {} as never }
        const { steam: _, ...hidden } = account({ lock, editedAt: 9 })
        const locked = await seal('a', 5, hidden)
        // Refreshed elsewhere after the lock, from the copy before it.
        const refreshed = await seal(
            'a',
            8,
            account({ steam: snapshot(8, 11) }),
        )
        expect(await mergeRecords(key, [locked], [refreshed])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        const same = await seal('a', 6, { ...hidden, alias: 'x' })
        expect(await mergeRecords(key, [locked], [same])).toEqual({
            toLocal: [same],
            toRemote: false,
        })
    })

    it('restamps a restored account as edited now, so it outlives later edits elsewhere', async () => {
        const restored = await restampEdited(
            key,
            await seal('a', 2, account({ note: 'old', editedAt: 2 })),
            30,
        )
        expect(restored.updatedAt).toBe(30)
        expect(await dataOf([restored], 'a')).toMatchObject({
            editedAt: 30,
            note: 'old',
        })
        const edited = await seal(
            'a',
            20,
            account({ note: 'new', editedAt: 20 }),
        )
        expect(await mergeRecords(key, [restored], [edited])).toEqual({
            toLocal: [],
            toRemote: true,
        })
        const tag = await seal('t', 1, { kind: RECORD.TAG, label: 'a' })
        expect(await restampEdited(key, tag, 30)).toEqual({
            ...tag,
            updatedAt: 30,
        })
    })
})

describe('sync through one copy', () => {
    async function sides() {
        const tag = await seal('tag', 1, { kind: RECORD.TAG, label: 'farm' })
        const local = [
            tag,
            await seal('a', 5, account({ note: 'here', editedAt: 5 })),
            await seal('b', 2, account({ order: 'a1' })),
            await seal('mine', 3, { kind: RECORD.TAG, label: 'new' }),
        ]
        const remote = [
            tag,
            await seal('a', 7, account({ steam: snapshot(7, 50) })),
            tomb('b', 4),
            await seal('theirs', 3, { kind: RECORD.TAG, label: 'other' }),
        ]
        return { local, remote }
    }

    it('is idempotent: merging the result again with either side changes nothing', async () => {
        const { local, remote } = await sides()
        const merged = apply(
            local,
            (await mergeRecords(key, local, remote)).toLocal,
        )
        for (const side of [local, remote]) {
            expect((await mergeRecords(key, merged, side)).toLocal).toEqual([])
            expect((await mergeRecords(key, side, merged)).toRemote).toBe(false)
        }
        expect((await dataOf(merged, 'a'))?.note).toBe('here')
        expect((await dataOf(merged, 'a'))?.steam?.level).toBe(50)
        expect(merged.find(({ id }) => id === 'b')).toEqual(tomb('b', 4))
        expect(merged.map(({ id }) => id).sort()).toEqual([
            'a',
            'b',
            'mine',
            'tag',
            'theirs',
        ])
    })

    it('brings two devices to the same records through one copy', async () => {
        const { local, remote } = await sides()
        let copy: SealedRecord[] = []
        let deviceA: SealedRecord[] = local
        let deviceB: SealedRecord[] = remote
        async function sync(device: SealedRecord[]) {
            const { toLocal, toRemote } = await mergeRecords(key, device, copy)
            const next = apply(device, toLocal)
            if (toRemote) copy = next
            return next
        }
        deviceA = await sync(deviceA)
        deviceB = await sync(deviceB)
        deviceA = await sync(deviceA)
        expect((await mergeRecords(key, deviceA, copy)).toRemote).toBe(false)
        const sorted = (records: SealedRecord[]) =>
            [...records].sort((a, b) => (a.id < b.id ? -1 : 1))
        expect(sorted(deviceA)).toEqual(sorted(copy))
        expect(sorted(deviceB)).toEqual(sorted(copy))
    })
})
