import { describe, expect, it } from 'vitest'

import {
    changePassword,
    createVault,
    type LiveRecord,
    newerSlots,
    openData,
    openSecret,
    readRecords,
    type SealedRecord,
    sealRecord,
    UnsupportedVaultError,
    unlockVault,
    type VaultFile,
    WrongPasswordError,
    writeRecords,
} from '../index'

// One vault for the suite: every password check runs 600k PBKDF2 rounds.
const PASSWORD = 'correct horse'
const { file: empty, key } = await createVault(PASSWORD)
const id = crypto.randomUUID()
const live = await sealRecord(key, {
    id,
    updatedAt: 1,
    data: { nickname: 'nova_owl0' },
    secret: { password: 'hunter2' },
})
const gone: SealedRecord = { id: 'gone', updatedAt: 2, deleted: true }
// A clone, as IndexedDB and a file round trip hand it back.
const file: VaultFile = structuredClone(
    await writeRecords(key, empty, [live, gone]),
)

describe('vault file', () => {
    it('opens its records again with the password', async () => {
        const reopened = await unlockVault(file, PASSWORD)
        const [record, tombstone] = await readRecords(reopened, file)
        expect(await openData(reopened, record as LiveRecord)).toEqual({
            nickname: 'nova_owl0',
        })
        expect(await openSecret(reopened, record as LiveRecord)).toEqual({
            password: 'hunter2',
        })
        expect(tombstone).toEqual(gone)
    })

    it('shows no record, id or count without the password', () => {
        const text = JSON.stringify(file)
        expect(text).not.toContain(id)
        expect(text).not.toContain('nova_owl0')
        expect(Object.keys(file).sort()).toEqual([
            'body',
            'format',
            'id',
            'slots',
            'version',
        ])
    })

    it('rejects a wrong password', async () => {
        await expect(unlockVault(file, 'wrong')).rejects.toBeInstanceOf(
            WrongPasswordError,
        )
    })

    it('changes the password and keeps the records', async () => {
        const changed = await changePassword(file, PASSWORD, 'new one')
        await expect(unlockVault(changed, PASSWORD)).rejects.toBeInstanceOf(
            WrongPasswordError,
        )
        const reopened = await unlockVault(changed, 'new one')
        expect(await readRecords(reopened, changed)).toEqual([live, gone])
        await expect(
            changePassword(file, 'wrong', 'other'),
        ).rejects.toBeInstanceOf(WrongPasswordError)
    })

    it('stamps a password change, so the later one wins a sync', async () => {
        expect(file.slots.changedAt).toBeUndefined()
        const before = Date.now()
        const changed = await changePassword(file, PASSWORD, 'new one')
        expect(changed.slots.changedAt).toBeGreaterThanOrEqual(before)
        expect(newerSlots(file.slots, changed.slots)).toBe(changed.slots)
        expect(newerSlots(changed.slots, file.slots)).toBe(changed.slots)
        // A tie keeps the local slots.
        expect(newerSlots(changed.slots, { ...changed.slots })).toBe(
            changed.slots,
        )
    })

    it('refuses a part moved to another record', async () => {
        const moved = { ...live, id: crypto.randomUUID() }
        await expect(openData(key, moved)).rejects.toThrow()
        await expect(
            openData(key, { ...live, data: live.secret as string }),
        ).rejects.toThrow()
    })

    it('stops at a record or a version it cannot read', async () => {
        for (const unknown of [
            { ...live, deleted: true },
            { ...live, secret: 42 },
        ]) {
            const odd = await writeRecords(key, empty, [
                unknown as unknown as SealedRecord,
            ])
            await expect(readRecords(key, odd)).rejects.toBeInstanceOf(
                UnsupportedVaultError,
            )
        }
        const later = { ...file, version: 2 } as unknown as VaultFile
        await expect(unlockVault(later, PASSWORD)).rejects.toBeInstanceOf(
            UnsupportedVaultError,
        )
    })

    it('tells a damaged slot from a wrong password', async () => {
        const slot = file.slots.password
        const damaged = {
            ...file,
            slots: { password: { ...slot, key: slot.key.slice(0, 40) } },
        }
        await expect(unlockVault(damaged, PASSWORD)).rejects.toBeInstanceOf(
            UnsupportedVaultError,
        )
        await expect(
            changePassword(damaged, PASSWORD, 'other'),
        ).rejects.toBeInstanceOf(UnsupportedVaultError)
    })
})
