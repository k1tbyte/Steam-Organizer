import {
    isV2Sealed,
    parseVaultFile,
    readV2Export,
    type V2Account,
    type VaultFile,
} from '@so/core'

/** What a picked file is to the open vault, which says how it imports. */
export type ImportFile =
    /** This vault's whole file (an export, a backup): replaces it. */
    | { kind: 'replace'; file: VaultFile }
    /** This vault's partial file: merges. */
    | { kind: 'merge'; file: VaultFile }
    /** Another vault's partial file: its password, then its accounts are added. */
    | { kind: 'other-partial'; file: VaultFile }
    /** Another vault's whole file: a vault of its own, from the unlock screen. */
    | { kind: 'other-vault' }
    /** The old app's plain export. */
    | { kind: 'v2'; accounts: V2Account[] }
    /** The old app's encrypted export: its password first. */
    | { kind: 'v2-sealed'; bytes: Uint8Array<ArrayBuffer> }
    | { kind: 'unreadable' }

function utf8(bytes: Uint8Array) {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
        return null
    }
}

function vaultFile(bytes: Uint8Array<ArrayBuffer>) {
    try {
        return parseVaultFile(bytes)
    } catch {
        return null
    }
}

export function importFile(
    bytes: Uint8Array<ArrayBuffer>,
    vaultId: string,
): ImportFile {
    const file = vaultFile(bytes)
    if (file) {
        const ours = file.id === vaultId
        if (file.partial)
            return { kind: ours ? 'merge' : 'other-partial', file }
        return ours ? { kind: 'replace', file } : { kind: 'other-vault' }
    }
    const text = utf8(bytes)
    const accounts = text === null ? null : readV2Export(text)
    if (accounts) return { kind: 'v2', accounts }
    if (isV2Sealed(bytes)) return { kind: 'v2-sealed', bytes }
    return { kind: 'unreadable' }
}
