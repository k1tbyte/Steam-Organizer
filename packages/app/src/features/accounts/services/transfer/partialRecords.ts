import {
    type AccountSecret,
    type LiveRecord,
    openSecret,
    readAccount,
    readService,
    readTag,
    type SealedRecord,
    type VaultKey,
} from '@so/core'

interface Contents {
    records: readonly SealedRecord[]
    data: ReadonlyMap<string, unknown>
}

/** What a partial export holds: the picked accounts as stored (a locked one unopened), the tags they carry and the
 *  user's services their credentials name, so another vault can name them too. */
export async function partialRecords(
    key: VaultKey,
    contents: Contents,
    ids: Iterable<string>,
): Promise<{ records: LiveRecord[]; accounts: number }> {
    const picked = new Set(ids)
    const live = contents.records.filter(
        (record): record is LiveRecord => !('deleted' in record),
    )
    const accounts = live.flatMap((record) => {
        const data = readAccount(contents.data.get(record.id))
        return data && picked.has(record.id) ? [{ record, data }] : []
    })
    const tags = new Set(accounts.flatMap(({ data }) => data.tags))
    const services = new Set<string>()
    for (const { record, data } of accounts) {
        // An account's own password seals its secret: nothing is opened for it.
        if (data.lock) continue
        const secret = await openSecret<AccountSecret>(key, record)
        for (const entry of secret?.services ?? []) services.add(entry.service)
    }
    const kept = (record: LiveRecord) => {
        const data = contents.data.get(record.id)
        if (readTag(data)) return tags.has(record.id)
        if (readService(data)) return services.has(record.id)
        return false
    }
    return {
        records: [
            ...accounts.map(({ record }) => record),
            ...live.filter(kept),
        ],
        accounts: accounts.length,
    }
}
