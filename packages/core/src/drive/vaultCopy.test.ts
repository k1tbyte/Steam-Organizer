import { expect, it } from 'vitest'

import type { VaultSlots } from '../crypto/keys'
import { UnsupportedVaultError } from '../errors'
import { VAULT_FORMAT, type VaultFile } from '../vault/vault'
import { saveBackup } from './backups'
import type { DriveFile } from './drive'
import { listCopies, readCopy, saveCopy } from './vaultCopy'

/** The fake Drive of `backups.test.ts`, with `update`, and a version that moves with each write. */
function fakeDrive() {
    const files: (DriveFile & { body: string })[] = []
    let written = 0
    const find = (id: string) => {
        const file = files.find((item) => item.id === id)
        if (!file) throw new Error('not found')
        return file
    }
    return {
        files,
        async list(properties: Record<string, string>) {
            return files.filter((file) =>
                Object.entries(properties).every(
                    ([key, value]) => file.appProperties[key] === value,
                ),
            )
        },
        async create(
            name: string,
            appProperties: Record<string, string>,
            body: string,
        ) {
            written++
            const file = {
                id: `f${files.length}`,
                name,
                size: body.length,
                createdTime: written,
                modifiedTime: written,
                version: String(written),
                appProperties,
                body,
            }
            files.push(file)
            return file
        },
        async update(
            id: string,
            appProperties: Record<string, string>,
            body: string,
        ) {
            written++
            const file = find(id)
            Object.assign(file, {
                body,
                size: body.length,
                modifiedTime: written,
                version: String(written),
                appProperties: { ...file.appProperties, ...appProperties },
            })
            return file
        },
        async download(id: string) {
            return find(id).body
        },
    }
}

const vaultFile = (id: string, body = 'sealed'): VaultFile => ({
    format: VAULT_FORMAT,
    version: 1,
    id,
    slots: { password: {} } as VaultSlots,
    body,
})

it('creates a copy without an id and writes over it with one, its version moving', async () => {
    const drive = fakeDrive()
    const created = await saveCopy(drive, vaultFile('v1'), {
        vaultName: 'Main',
        accounts: 3,
    })
    expect(created).toEqual({
        id: 'f0',
        vaultId: 'v1',
        vaultName: 'Main',
        accounts: 3,
        version: '1',
        modifiedAt: 1,
        sizeBytes: JSON.stringify(vaultFile('v1')).length,
    })
    const updated = await saveCopy(
        drive,
        vaultFile('v1', 'newer'),
        { vaultName: 'Main renamed', accounts: 4 },
        created.id,
    )
    expect(updated).toMatchObject({
        id: 'f0',
        vaultName: 'Main renamed',
        accounts: 4,
        version: '2',
    })
    expect(drive.files).toHaveLength(1)
    expect(await readCopy(drive, created.id)).toEqual(vaultFile('v1', 'newer'))
})

it('lists one vault, or every vault, oldest first, and never a backup', async () => {
    const drive = fakeDrive()
    await saveCopy(drive, vaultFile('v1'), { vaultName: 'Main', accounts: 1 })
    await saveBackup(drive, vaultFile('v1'), {
        vaultName: 'Main',
        kind: 'manual',
        accounts: 1,
    })
    await saveCopy(drive, vaultFile('v2'), { vaultName: 'Farm', accounts: 9 })
    // A second device's first push before it saw the first one.
    await saveCopy(drive, vaultFile('v1'), { vaultName: 'Main', accounts: 2 })
    // Written last, still the oldest.
    await saveCopy(
        drive,
        vaultFile('v1'),
        { vaultName: 'Main', accounts: 5 },
        'f0',
    )

    expect((await listCopies(drive, 'v1')).map(({ id }) => id)).toEqual([
        'f0',
        'f3',
    ])
    expect((await listCopies(drive)).map(({ id }) => id)).toEqual([
        'f0',
        'f2',
        'f3',
    ])
})

it('cuts a long vault name to what Drive holds per property', async () => {
    const drive = fakeDrive()
    const copy = await saveCopy(drive, vaultFile('v1'), {
        vaultName: 'Ферма'.repeat(30),
        accounts: 0,
    })
    const bytes = new TextEncoder().encode(`vaultName${copy.vaultName}`)
    expect(bytes.length).toBeLessThanOrEqual(124)
})

it('refuses a copy of a newer format or a damaged one', async () => {
    const drive = fakeDrive()
    const { id } = await saveCopy(drive, vaultFile('v1'), {
        vaultName: 'Main',
        accounts: 0,
    })
    const stored = drive.files[0]
    if (stored) stored.body = JSON.stringify({ ...vaultFile('v1'), version: 2 })
    await expect(readCopy(drive, id)).rejects.toThrow(UnsupportedVaultError)
    if (stored) stored.body = '{"format":'
    await expect(readCopy(drive, id)).rejects.toThrow(UnsupportedVaultError)
})
