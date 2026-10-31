import {
    parseVaultFile,
    serializeVaultFile,
    type VaultFile,
} from '../vault/vault'
import { type DriveApi, type DriveFile, fit } from './drive'

export type BackupKind = 'auto' | 'manual'

/** A backup in the app's Drive folder; everything here reads before unlock. */
export interface Backup {
    id: string
    vaultId: string
    vaultName: string
    kind: BackupKind
    accounts: number
    createdAt: number
    sizeBytes: number
}

export type BackupMeta = Pick<Backup, 'vaultName' | 'kind' | 'accounts'>

const TYPE = 'backup'

const toBackup = ({
    id,
    appProperties,
    createdTime,
    size,
}: DriveFile): Backup => ({
    id,
    vaultId: appProperties.vault ?? '',
    vaultName: appProperties.vaultName ?? '',
    kind: appProperties.kind === 'auto' ? 'auto' : 'manual',
    accounts: Number(appProperties.accounts) || 0,
    createdAt: createdTime,
    sizeBytes: size,
})

/** This vault's backups, or every vault's; newest first. */
export async function listBackups(
    api: Pick<DriveApi, 'list'>,
    vaultId?: string,
): Promise<Backup[]> {
    const files = await api.list({
        type: TYPE,
        ...(vaultId && { vault: vaultId }),
    })
    return files.map(toBackup).sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveBackup(
    api: Pick<DriveApi, 'create'>,
    file: VaultFile,
    meta: BackupMeta,
): Promise<Backup> {
    const saved = await api.create(
        'backup.json',
        {
            type: TYPE,
            vault: file.id,
            vaultName: fit('vaultName', meta.vaultName),
            kind: meta.kind,
            accounts: String(meta.accounts),
        },
        serializeVaultFile(file),
    )
    return toBackup(saved)
}

/** The sealed vault file a backup holds; a newer format or a damaged file refuses. */
export async function readBackup(
    api: Pick<DriveApi, 'download'>,
    id: string,
): Promise<VaultFile> {
    return parseVaultFile(await api.download(id))
}
