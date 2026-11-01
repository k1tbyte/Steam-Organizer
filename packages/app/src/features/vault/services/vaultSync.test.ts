import {
    createVault,
    openSecret,
    orderKeys,
    RECORD,
    readAccount,
    readRecords,
    type SealedRecord,
    sealRecord,
    writeRecords,
} from '@so/core'
import { expect, it } from 'vitest'

import { openContents, type VaultContents } from './vaultContents'
import { FIRST_PUSH, mergeCopyInto, newVault } from './vaultSync'

// One vault for the suite: creating one runs 600k PBKDF2 rounds.
const { key, file } = await createVault('correct horse')
const NOW = Date.now()

const account = (id: string, order: string, patch: object = {}) => ({
    id,
    updatedAt: 5,
    data: {
        kind: RECORD.ACCOUNT,
        steamId: null,
        tags: [],
        pinned: false,
        order,
        addedAt: 1,
        editedAt: 1,
        guard: false,
        loginTag: '',
        steam: null,
        ...patch,
    },
    secret: { password: 'pw' },
})

const gone = (id: string, updatedAt: number) =>
    ({ id, updatedAt, deleted: true }) as const

/** Merges a copy holding `remote` into a linked vault holding `local`, its last push acknowledged. */
async function merge(
    local: readonly SealedRecord[],
    remote: readonly SealedRecord[],
) {
    const localFile = await writeRecords(key, file, local)
    const vault = newVault('Main', localFile, { ...FIRST_PUSH, revision: 0 })
    const copy = await writeRecords(key, file, remote)
    const current = await openContents(key, localFile)
    return {
        vault,
        copy,
        ...(await mergeCopyInto(key, vault, current, copy, NOW)),
    }
}

const orderOf = (contents: VaultContents | undefined, id: string) =>
    readAccount(contents?.data.get(id))?.order ?? ''

it('rekeys one of two accounts added at the same order key, keeps its stamps and asks for a push', async () => {
    const original = await sealRecord(key, account('acc-b', 'a1'))
    const other = await sealRecord(key, account('acc-a', 'a1'))
    const result = await merge([original], [other])
    const contents = result.changed?.contents
    expect(result.push).toBe(true)
    expect(orderOf(contents, 'acc-a')).toBe('a1')
    expect(orderOf(contents, 'acc-b') > 'a1').toBe(true)
    expect(contents?.records.find(({ id }) => id === 'acc-b')?.updatedAt).toBe(
        5,
    )
    expect(readAccount(contents?.data.get('acc-b'))?.editedAt).toBe(1)
    // A move between the two no longer meets equal neighbours.
    expect(() =>
        orderKeys(orderOf(contents, 'acc-a'), orderOf(contents, 'acc-b'), 1),
    ).not.toThrow()

    // Once pushed, a merge with that copy finds nothing to write or push.
    if (!result.changed) throw new Error('nothing merged')
    const { file: pushed } = result.changed
    const again = await mergeCopyInto(
        key,
        { ...result.vault, file: pushed },
        contents as VaultContents,
        pushed,
        NOW,
    )
    expect(again).toEqual({ changed: null, taken: [], push: false })

    // A copy that still holds the tie wins the equal stamp, and the merge rekeys it the same way again.
    const tied = await writeRecords(key, file, [other, original])
    const back = await mergeCopyInto(
        key,
        { ...result.vault, file: pushed },
        contents as VaultContents,
        tied,
        NOW,
    )
    expect(back.push).toBe(true)
    expect(orderOf(back.changed?.contents, 'acc-b')).toBe(
        orderOf(contents, 'acc-b'),
    )
})

it('rekeys an everything-locked account from the copy without opening its secret', async () => {
    const accountKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    )
    const lock = { scope: 'everything', slots: {} }
    const locked = await sealRecord(
        key,
        {
            ...account('acc-b', 'a1', { editedAt: 7, lock }),
            secret: { password: 'locked' },
        },
        accountKey,
    )
    const result = await merge(
        [await sealRecord(key, account('acc-a', 'a1'))],
        [locked],
    )
    const contents = result.changed?.contents
    const record = contents?.records.find(({ id }) => id === 'acc-b')
    if (!record || 'deleted' in record) throw new Error('no record')
    expect(result.push).toBe(true)
    expect(orderOf(contents, 'acc-b') > 'a1').toBe(true)
    expect(record.secret).toBe(locked.secret)
    expect(await openSecret(key, record, accountKey)).toEqual({
        password: 'locked',
    })
    expect(readAccount(contents?.data.get('acc-b'))).toMatchObject({
        editedAt: 7,
        lock,
    })
})

it('drops expired tombstones and the record one beat from the file, never pushing for them', async () => {
    const a = await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } })
    const b = await sealRecord(key, { id: 'b', updatedAt: 2, data: { n: 2 } })
    const result = await merge(
        [a, b, gone('old', 1)],
        [a, gone('b', 3), gone('copy-only', 1), gone('fresh', NOW)],
    )
    expect(result.push).toBe(false)
    expect(result.taken.sort()).toEqual(['b', 'fresh', 'old'])
    const { file: merged, contents } = result.changed ?? {}
    if (!merged) throw new Error('nothing merged')
    const records = await readRecords(key, merged)
    expect(records.map(({ id }) => id).sort()).toEqual(['a', 'fresh'])
    expect([...(contents?.data.keys() ?? [])]).toEqual(['a'])
})

it('purges a file merged with itself, as a sync with nothing to download does, without a push', async () => {
    const a = await sealRecord(key, { id: 'a', updatedAt: 1, data: { n: 1 } })
    const records = [a, gone('old', 1), gone('fresh', NOW)]
    const result = await merge(records, records)
    expect(result.push).toBe(false)
    expect(result.taken).toEqual(['old'])
    const merged = result.changed?.file
    if (!merged) throw new Error('nothing merged')
    expect((await readRecords(key, merged)).map(({ id }) => id)).toEqual([
        'a',
        'fresh',
    ])
})
