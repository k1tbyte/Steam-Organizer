import {
    openV2Export,
    readRecords,
    type SealedRecord,
    unlockVault,
    type V2Account,
    type VaultFile,
    type VaultKey,
    WrongPasswordError,
} from '@so/core'

import {
    findService,
    newServiceRecord,
    numberedServiceName,
    ownServices,
    serviceName,
} from '#features/linked-services'
import { fitsLogin, readMaFile } from '#features/steam-guard'
import { tally, useVaultSession } from '#features/vault'

import {
    accountCount,
    crossVaultAccounts,
} from '../../services/transfer/crossVault'
import { importFile } from '../../services/transfer/importFile'
import {
    type IncomingAccount,
    resolveIncoming,
} from '../../services/transfer/incoming'
import { legacyAccounts } from '../../services/transfer/legacyAccounts'
import { mergedImport } from '../../services/transfer/vaultMerge'
import { useVaultAccounts } from '../useVaultAccounts'

export interface ImportResult {
    imported: number
    /** Already in the vault: the same Steam ID, else the same login. */
    skipped: number
    /** Under a password of their own in another vault. */
    locked: number
}

/** A read file, waiting for the user: each confirm writes into the vault it was read for, or resolves null once
 *  another is open. */
export type StagedImport =
    | { step: 'replace'; confirm: () => Promise<number | null> }
    | {
          step: 'merge' | 'add'
          accounts: number
          locked: number
          confirm: () => Promise<ImportResult | null>
      }
    | {
          step: 'password'
          source: 'vault' | 'v2'
          open: (password: string) => Promise<StagedImport | 'wrong'>
      }
    | { step: 'other-vault' | 'unreadable' }

/** Import into the open vault by what the file is (`importFile`). A file read with a key is written only into the
 *  vault it was read for; what it decrypts lives in the staged step and goes with it. */
export function useVaultImport() {
    const session = useVaultSession()
    const vault = useVaultAccounts()

    const into = <T>(vaultId: string, write: () => Promise<T>) =>
        session.vault?.id === vaultId ? write() : Promise.resolve(null)

    function add(incoming: readonly IncomingAccount[]) {
        return vault.addMany(async (contents, key) => {
            const own = ownServices(contents.data)
            return resolveIncoming(
                key,
                contents.data,
                incoming,
                {
                    find: (name) => findService(own, name)?.id,
                    clean: serviceName,
                    numbered: numberedServiceName,
                    record: (name) => newServiceRecord(key, name, Date.now()),
                },
                Date.now(),
            )
        })
    }

    async function merge(records: readonly SealedRecord[]) {
        const changed: string[] = []
        const result = { imported: 0, skipped: 0, locked: 0 }
        await session.transact(async (contents, key) => {
            const merged = await mergedImport(key, contents, records)
            changed.push(...merged.records.map(({ id }) => id))
            result.imported = merged.imported
            result.skipped = merged.skipped
            return merged.records
        })
        // A locked account may come back sealed under its key of that time.
        for (const id of changed) session.dropKey(id)
        return result
    }

    function fromVault(
        vaultId: string,
        key: VaultKey,
        records: readonly SealedRecord[],
        { accounts, locked }: { accounts: number; locked: number },
    ): StagedImport {
        return {
            step: 'add',
            accounts: accounts - locked,
            locked,
            confirm: () =>
                into(vaultId, async () => {
                    const opened = await crossVaultAccounts(key, records)
                    // Another vault may have opened while the file decrypted.
                    if (session.vault?.id !== vaultId) return null
                    const { added, skipped } = await add(opened.accounts)
                    return { imported: added, skipped, locked: opened.locked }
                }),
        }
    }

    function fromV2(vaultId: string, accounts: V2Account[]): StagedImport {
        return {
            step: 'add',
            accounts: accounts.length,
            locked: 0,
            confirm: () =>
                into(vaultId, async () => {
                    const incoming = legacyAccounts(
                        accounts,
                        { read: readMaFile, fits: fitsLogin },
                        Date.now(),
                    )
                    const { added, skipped } = await add(incoming)
                    return { imported: added, skipped, locked: 0 }
                }),
        }
    }

    // Undefined once the vault closed meanwhile.
    const ownRecords = (file: VaultFile) =>
        session.withKey((key) => readRecords(key, file))

    /** Throws `UnsupportedVaultError` (or a crypto failure) for a file of this vault it can't read. */
    async function read(bytes: Uint8Array<ArrayBuffer>): Promise<StagedImport> {
        const vaultId = session.vault?.id
        if (!vaultId) return { step: 'unreadable' }
        const found = importFile(bytes, vaultId)
        switch (found.kind) {
            case 'replace': {
                const records = await ownRecords(found.file)
                if (!records) return { step: 'unreadable' }
                return {
                    step: 'replace',
                    confirm: () =>
                        into(vaultId, async () => {
                            await session.replaceRecords(records)
                            return tally(session.contents).accounts
                        }),
                }
            }
            case 'merge': {
                const records = await ownRecords(found.file)
                if (!records) return { step: 'unreadable' }
                const count = await session.withKey((key) =>
                    accountCount(key, records),
                )
                return {
                    step: 'merge',
                    accounts: count?.accounts ?? 0,
                    locked: 0,
                    confirm: () => into(vaultId, () => merge(records)),
                }
            }
            case 'other-partial':
                return {
                    step: 'password',
                    source: 'vault',
                    open: async (password) => {
                        let key: VaultKey
                        try {
                            key = await unlockVault(found.file, password)
                        } catch (failure) {
                            if (failure instanceof WrongPasswordError)
                                return 'wrong'
                            throw failure
                        }
                        const records = await readRecords(key, found.file)
                        const count = await accountCount(key, records)
                        return fromVault(vaultId, key, records, count)
                    },
                }
            case 'v2':
                return fromV2(vaultId, found.accounts)
            case 'v2-sealed':
                return {
                    step: 'password',
                    source: 'v2',
                    open: async (password) => {
                        try {
                            const accounts = await openV2Export(
                                found.bytes,
                                password,
                            )
                            return fromV2(vaultId, accounts)
                        } catch (failure) {
                            if (failure instanceof WrongPasswordError)
                                return 'wrong'
                            throw failure
                        }
                    },
                }
            case 'other-vault':
                return { step: 'other-vault' }
            default:
                return { step: 'unreadable' }
        }
    }

    return { read }
}
