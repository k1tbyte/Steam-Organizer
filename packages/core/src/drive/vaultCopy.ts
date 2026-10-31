import {
    parseVaultFile,
    serializeVaultFile,
    type VaultFile,
} from '../vault/vault'
import { type DriveApi, type DriveFile, fit } from './drive'

/** A vault's synced copy in the app's Drive folder, one per vault; everything here reads before unlock. */
export interface VaultCopy {
    id: string
    vaultId: string
    vaultName: string
    accounts: number
    /** Drive's version: it moves with every write, from any device. */
    version: string
    modifiedAt: number
    sizeBytes: number
}

export type VaultCopyMeta = Pick<VaultCopy, 'vaultName' | 'accounts'>

const TYPE = 'vault'

const toCopy = ({
    id,
    appProperties,
    version,
    modifiedTime,
    size,
}: DriveFile): VaultCopy => ({
    id,
    vaultId: appProperties.vault ?? '',
    vaultName: appProperties.vaultName ?? '',
    accounts: Number(appProperties.accounts) || 0,
    version,
    modifiedAt: modifiedTime,
    sizeBytes: size,
})

/** This vault's copies, or every vault's; oldest first, so of two devices' first pushes both keep the same one. */
export async function listCopies(
    api: Pick<DriveApi, 'list'>,
    vaultId?: string,
): Promise<VaultCopy[]> {
    const files = await api.list({
        type: TYPE,
        ...(vaultId && { vault: vaultId }),
    })
    return files
        .sort((a, b) => a.createdTime - b.createdTime || (a.id < b.id ? -1 : 1))
        .map(toCopy)
}

/** The sealed vault file a copy holds; a newer format or a damaged file refuses. */
export async function readCopy(
    api: Pick<DriveApi, 'download'>,
    id: string,
): Promise<VaultFile> {
    return parseVaultFile(await api.download(id))
}

/** Writes `file` over copy `id`, or creates the vault's copy without one. */
export async function saveCopy(
    api: Pick<DriveApi, 'create' | 'update'>,
    file: VaultFile,
    meta: VaultCopyMeta,
    id?: string,
): Promise<VaultCopy> {
    const properties = {
        type: TYPE,
        vault: file.id,
        vaultName: fit('vaultName', meta.vaultName),
        accounts: String(meta.accounts),
    }
    const body = serializeVaultFile(file)
    const saved = id
        ? await api.update(id, properties, body)
        : await api.create('vault.json', properties, body)
    return toCopy(saved)
}
