import { describe, expect, it } from 'vitest'

import {
    changeAccountPassword,
    changePassword,
    createAccountKey,
    createVault,
    openAccountKey,
    openSecret,
    sealRecord,
    unlockVault,
    WrongPasswordError,
    withRecovery,
} from '../index'

// One vault for the suite: every password check runs 600k PBKDF2 rounds.
const MASTER = 'correct horse'
const { file, key } = await createVault(MASTER)
const id = crypto.randomUUID()
const { key: accountKey, slots } = await createAccountKey(key, id, '1234', true)
const record = await sealRecord(
    key,
    { id, updatedAt: 1, data: {}, secret: { password: 'hunter2' } },
    accountKey,
)
const secretWith = (opened: CryptoKey) => openSecret(key, record, opened)

describe('account key', () => {
    it('seals the secret so the vault key alone cannot open it', async () => {
        await expect(openSecret(key, record)).rejects.toThrow()
    })

    it('opens with the account password and refuses a wrong one', async () => {
        const opened = await openAccountKey(key, file.slots, id, slots, {
            password: '1234',
        })
        expect(await secretWith(opened)).toEqual({ password: 'hunter2' })
        await expect(
            openAccountKey(key, file.slots, id, slots, { password: '0000' }),
        ).rejects.toBeInstanceOf(WrongPasswordError)
    })

    it('opens with the master password through recovery', async () => {
        const opened = await openAccountKey(key, file.slots, id, slots, {
            master: MASTER,
        })
        expect(await secretWith(opened)).toEqual({ password: 'hunter2' })
        await expect(
            openAccountKey(key, file.slots, id, slots, { master: 'wrong' }),
        ).rejects.toBeInstanceOf(WrongPasswordError)
    })

    it('has no recovery slot when recovery is off', async () => {
        const off = await createAccountKey(key, id, '1234', false)
        expect(off.slots.recovery).toBeUndefined()
        await expect(
            openAccountKey(key, file.slots, id, off.slots, { master: MASTER }),
        ).rejects.toThrow()
    })

    it('binds the slots to the account id', async () => {
        await expect(
            openAccountKey(key, file.slots, 'other', slots, {
                password: '1234',
            }),
        ).rejects.toThrow()
    })

    it('changes the account password through either credential', async () => {
        const next = await changeAccountPassword(
            key,
            file.slots,
            id,
            slots,
            { master: MASTER },
            'abcd',
        )
        const opened = await openAccountKey(key, file.slots, id, next, {
            password: 'abcd',
        })
        expect(await secretWith(opened)).toEqual({ password: 'hunter2' })
        await expect(
            openAccountKey(key, file.slots, id, next, { password: '1234' }),
        ).rejects.toBeInstanceOf(WrongPasswordError)
        expect(next.recovery).toBe(slots.recovery)
    })

    it('keeps recovery working after a master password change', async () => {
        const changed = await changePassword(file, MASTER, 'battery staple')
        const reopened = await unlockVault(changed, 'battery staple')
        const opened = await openAccountKey(
            reopened,
            changed.slots,
            id,
            slots,
            {
                master: 'battery staple',
            },
        )
        expect(await secretWith(opened)).toEqual({ password: 'hunter2' })
        await expect(
            openAccountKey(reopened, changed.slots, id, slots, {
                master: MASTER,
            }),
        ).rejects.toBeInstanceOf(WrongPasswordError)
    })

    it('gives a vault made before recovery a slot at unlock', async () => {
        const { recovery: _, ...password } = file.slots
        const old = { ...file, slots: password }
        const oldKey = await unlockVault(old, MASTER)
        expect(oldKey.recovery).toBeUndefined()
        const added = await withRecovery(old, oldKey, MASTER)
        expect(added?.key.recovery).toBeDefined()
        expect(
            (await unlockVault(added?.file ?? old, MASTER)).recovery,
        ).toBeDefined()
        expect(await withRecovery(file, key, MASTER)).toBeNull()
    })
})
