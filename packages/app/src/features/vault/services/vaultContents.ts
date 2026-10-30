import {
    openData,
    readAccount,
    readRecords,
    type SealedRecord,
    type VaultFile,
    type VaultKey,
} from '@so/core'

/** The open vault's records with their data parts opened: lists read data, secrets open on demand. */
export interface VaultContents {
    records: readonly SealedRecord[]
    /** The opened data part of every live record, by id. */
    data: ReadonlyMap<string, unknown>
}

export const EMPTY_CONTENTS: VaultContents = { records: [], data: new Map() }

async function openInto(
    key: VaultKey,
    records: readonly SealedRecord[],
    data: Map<string, unknown>,
) {
    await Promise.all(
        records.map(async (record) => {
            if ('deleted' in record) data.delete(record.id)
            else data.set(record.id, await openData(key, record))
        }),
    )
    return data
}

export async function openContents(
    key: VaultKey,
    file: VaultFile,
): Promise<VaultContents> {
    const records = await readRecords(key, file)
    return { records, data: await openInto(key, records, new Map()) }
}

/** `changed` replace the records with their ids or join at the end; only their data parts open again. */
export async function withChanges(
    key: VaultKey,
    contents: VaultContents,
    changed: readonly SealedRecord[],
): Promise<VaultContents> {
    const byId = new Map(changed.map((record) => [record.id, record]))
    const records = contents.records.map((record) => {
        const next = byId.get(record.id)
        byId.delete(record.id)
        return next ?? record
    })
    records.push(...byId.values())
    return {
        records,
        data: await openInto(key, changed, new Map(contents.data)),
    }
}

/** Accounts in the vault and those with a Steam Guard authenticator; one hidden by an `everything` lock counts without. */
export function tally(contents: VaultContents | null) {
    let accounts = 0
    let authenticators = 0
    for (const data of contents?.data.values() ?? []) {
        const account = readAccount(data)
        if (!account) continue
        accounts++
        if (account.guard) authenticators++
    }
    return { accounts, authenticators }
}
