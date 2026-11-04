import {
    type AccountData,
    type AccountSecret,
    type LiveRecord,
    mergeRecords,
    openData,
    openSecret,
    readAccount,
    readService,
    readTag,
    type SealedRecord,
    sealRecord,
    updateData,
    type VaultKey,
} from '@so/core'

import { heldIn } from '../accountRecords'

interface Contents {
    records: readonly SealedRecord[]
    data: ReadonlyMap<string, unknown>
}

type Definition = 'tag' | 'service'

// A tag by its label, a service by its name: the same one whatever its id.
function definition(data: unknown): [Definition, string] | undefined {
    const tag = readTag(data)
    if (tag) return ['tag', `tag\0${tag.label.trim().toLowerCase()}`]
    const service = readService(data)
    if (service)
        return ['service', `service\0${service.name.trim().toLowerCase()}`]
}

/** A partial file of this vault, merged per record: added where missing, the newer stamp wins, nothing removed. An
 *  account the vault holds under another id (Steam ID, else login) stays out; a tag or service it holds by label or name
 *  stays out too, its accounts moved onto the vault's own. */
export async function mergedImport(
    key: VaultKey,
    contents: Contents,
    incoming: readonly SealedRecord[],
): Promise<{ records: LiveRecord[]; imported: number; skipped: number }> {
    const stamps = new Map(
        contents.records.map(({ id, updatedAt }) => [id, updatedAt]),
    )
    const held = await heldIn(key, contents)
    const opened: { record: LiveRecord; data: unknown }[] = []
    for (const record of incoming) {
        // A partial file holds no deletions; one that did would still remove nothing.
        if ('deleted' in record) continue
        opened.push({ record, data: await openData(key, record) })
    }
    // Names as the merge leaves them: a tie goes to the file, as in `mergeRecords`.
    const merged = new Map(contents.data)
    for (const { record, data } of opened)
        if (record.updatedAt >= (stamps.get(record.id) ?? Infinity))
            merged.set(record.id, data)
    const own = new Map<string, string>()
    for (const [id, data] of merged) {
        const found = definition(data)
        if (found) own.set(found[1], id)
    }
    const same = new Map<string, Same>()
    for (const { record, data } of opened) {
        const found = stamps.has(record.id) ? undefined : definition(data)
        const id = found && own.get(found[1])
        if (found && id) same.set(record.id, { id, kind: found[0] })
    }
    const accounts = new Set<string>()
    const kept: LiveRecord[] = []
    const needed = new Set<string>()
    for (const { record, data } of opened) {
        if (same.has(record.id)) continue
        const account = readAccount(data)
        if (!account) {
            kept.push(record)
            continue
        }
        accounts.add(record.id)
        if (!stamps.has(record.id) && (await held(account))) continue
        kept.push(await withOwnRefs(key, record, account, same, needed))
    }
    for (const { record } of opened)
        if (needed.has(record.id)) kept.push(record)
    const { toLocal } = await mergeRecords(key, contents.records, kept)
    const records = toLocal.filter(
        (record): record is LiveRecord => !('deleted' in record),
    )
    const imported = records.filter(({ id }) => accounts.has(id)).length
    return { records, imported, skipped: accounts.size - imported }
}

// The vault's own tag or service an incoming one of the same name stands for.
interface Same {
    id: string
    kind: Definition
}

// Under its own stamp: the refs change, the edit stays the other device's. A ref it can't move puts its id in `needed`.
async function withOwnRefs(
    key: VaultKey,
    record: LiveRecord,
    account: AccountData,
    same: ReadonlyMap<string, Same>,
    needed: Set<string>,
) {
    const lock = account.lock
    // A locked secret can't be read: the services it may name stay, under an everything lock its tags too.
    if (lock)
        for (const [id, { kind }] of same)
            if (kind === 'service' || lock.scope === 'everything')
                needed.add(id)
    const secret = lock
        ? undefined
        : await openSecret<AccountSecret>(key, record)
    const refs = [
        ...account.tags,
        ...(secret?.services.map(({ service }) => service) ?? []),
    ]
    if (!refs.some((id) => same.has(id))) return record
    const tags = new Set(account.tags.map((id) => same.get(id)?.id ?? id))
    const data = { ...account, tags: [...tags] }
    // A locked account keeps its secret as sealed.
    if (!secret) return updateData(key, record, data, record.updatedAt)
    const used = new Set(secret.services.map(({ service }) => service))
    const services = secret.services.map((entry) => {
        const id = same.get(entry.service)?.id
        if (!id) return entry
        // One entry per service: a second for the same one keeps its own.
        if (used.has(id)) {
            needed.add(entry.service)
            return entry
        }
        used.add(id)
        return { ...entry, service: id }
    })
    return sealRecord(key, {
        id: record.id,
        updatedAt: record.updatedAt,
        data,
        secret: { ...secret, services },
    })
}
