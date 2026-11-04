import { expect, it } from 'vitest'

import type { VaultSlots } from '../crypto/keys'
import { SEAL_OVERHEAD } from '../crypto/seal'
import { UnsupportedVaultError } from '../errors'
import { serializeVaultFile } from '../vault/container'
import { VAULT_FORMAT, type VaultFile } from '../vault/vault'
import { listBackups, readBackup, saveBackup } from './backups'
import type { DriveFile } from './drive'

function fakeDrive() {
    const files: (DriveFile & { body: Uint8Array<ArrayBuffer> })[] = []
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
            body: Uint8Array<ArrayBuffer>,
        ) {
            const file = {
                id: `f${files.length}`,
                name,
                size: body.length,
                createdTime: files.length,
                modifiedTime: files.length,
                version: '1',
                appProperties,
                body,
            }
            files.push(file)
            return file
        },
        async download(id: string) {
            return (
                files.find((file) => file.id === id)?.body ?? new Uint8Array()
            )
        },
    }
}

const vaultFile = (id: string): VaultFile => ({
    format: VAULT_FORMAT,
    version: 2,
    id,
    slots: { password: {} } as VaultSlots,
    body: new TextEncoder().encode('sealed'.padEnd(SEAL_OVERHEAD, '.')),
})

it('lists one vault, or every vault, newest first, with the metadata it was saved with', async () => {
    const drive = fakeDrive()
    await saveBackup(drive, vaultFile('v1'), {
        vaultName: 'Main',
        kind: 'manual',
        accounts: 3,
    })
    await saveBackup(drive, vaultFile('v2'), {
        vaultName: 'Farm',
        kind: 'auto',
        accounts: 40,
    })
    const saved = await saveBackup(drive, vaultFile('v1'), {
        vaultName: 'Main',
        kind: 'auto',
        accounts: 4,
    })
    expect(saved).toEqual({
        id: 'f2',
        vaultId: 'v1',
        vaultName: 'Main',
        kind: 'auto',
        accounts: 4,
        createdAt: 2,
        sizeBytes: serializeVaultFile(vaultFile('v1')).length,
    })
    expect((await listBackups(drive, 'v1')).map(({ id }) => id)).toEqual([
        'f2',
        'f0',
    ])
    expect((await listBackups(drive)).map(({ id }) => id)).toEqual([
        'f2',
        'f1',
        'f0',
    ])
})

it('cuts a long vault name to what Drive holds per property', async () => {
    const drive = fakeDrive()
    const backup = await saveBackup(drive, vaultFile('v1'), {
        vaultName: 'Ферма'.repeat(30),
        kind: 'manual',
        accounts: 0,
    })
    const bytes = new TextEncoder().encode(`vaultName${backup.vaultName}`)
    expect(bytes.length).toBeLessThanOrEqual(124)
    expect(backup.vaultName).toBe('Ферма'.repeat(30).slice(0, 57))
})

it('reads the vault file back, and refuses a newer format or a damaged file', async () => {
    const drive = fakeDrive()
    const { id } = await saveBackup(drive, vaultFile('v1'), {
        vaultName: 'Main',
        kind: 'manual',
        accounts: 0,
    })
    expect(await readBackup(drive, id)).toEqual(vaultFile('v1'))

    const newer = drive.files[0]
    if (newer)
        newer.body = serializeVaultFile({
            ...vaultFile('v1'),
            version: 3,
        } as unknown as VaultFile)
    await expect(readBackup(drive, id)).rejects.toThrow(UnsupportedVaultError)
    if (newer) newer.body = new TextEncoder().encode('{"format":')
    await expect(readBackup(drive, id)).rejects.toThrow(UnsupportedVaultError)
})
