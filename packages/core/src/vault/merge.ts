import { RECORD } from '../account/records'
import type { VaultKey } from '../crypto/keys'
import {
    type LiveRecord,
    openData,
    type SealedRecord,
    updateData,
} from './vault'

export interface MergedRecords {
    /** Results that differ from the local record, for the local file. */
    toLocal: SealedRecord[]
    /** Some result differs from the remote copy, so it needs a push. */
    toRemote: boolean
}

type Opened = Record<string, unknown>

function identical(a: SealedRecord, b: SealedRecord) {
    if (a.updatedAt !== b.updatedAt) return false
    if ('deleted' in a || 'deleted' in b)
        return 'deleted' in a && 'deleted' in b
    return a.data === b.data && a.secret === b.secret
}

const editedAt = (data: Opened) =>
    data.kind === RECORD.ACCOUNT && typeof data.editedAt === 'number'
        ? data.editedAt
        : undefined

// An everything lock seals `steam` into the secret: such a record merges whole.
function halves(data: Opened) {
    const lock = data.lock as { scope?: string } | undefined
    return (
        editedAt(data) !== undefined &&
        'steam' in data &&
        lock?.scope !== 'everything'
    )
}

const refreshedAt = (data: Opened) =>
    (data.steam as { refreshedAt?: number } | null)?.refreshedAt ?? 0

/** A restore is the user's edit: its accounts take `editedAt` `at`, so a merge keeps them over later edits elsewhere. */
export async function restampEdited(
    key: VaultKey,
    record: LiveRecord,
    at: number,
): Promise<LiveRecord> {
    const data = await openData<Opened>(key, record)
    if (editedAt(data) === undefined) return { ...record, updatedAt: at }
    return updateData(key, record, { ...data, editedAt: at }, at)
}

/** The user's fields from the newer `editedAt`, `steam` from the newer refresh: a refresh never undoes an edit. */
async function mergeHalves(
    key: VaultKey,
    local: { record: LiveRecord; data: Opened },
    remote: { record: LiveRecord; data: Opened },
): Promise<LiveRecord> {
    const edited = (side: typeof local) => side.data.editedAt as number
    const localUser =
        edited(local) > edited(remote) ||
        (edited(local) === edited(remote) &&
            local.record.updatedAt > remote.record.updatedAt)
    const [user, other] = localUser ? [local, remote] : [remote, local]
    const steam =
        refreshedAt(other.data) > refreshedAt(user.data)
            ? other.data.steam
            : user.data.steam
    const merged = { ...user.data, steam }
    const json = JSON.stringify(merged)
    // The user side's secret goes with its data; the other side holds the same result only with that secret.
    if (json === JSON.stringify(user.data)) return user.record
    if (
        other.record.secret === user.record.secret &&
        json === JSON.stringify(other.data)
    )
        return other.record
    return updateData(
        key,
        user.record,
        merged,
        Math.max(local.record.updatedAt, remote.record.updatedAt),
    )
}

async function mergeOne(
    key: VaultKey,
    local: SealedRecord,
    remote: SealedRecord,
): Promise<SealedRecord> {
    if (identical(local, remote)) return local
    if ('deleted' in local || 'deleted' in remote) {
        if (local.updatedAt !== remote.updatedAt)
            return local.updatedAt > remote.updatedAt ? local : remote
        return 'deleted' in local ? local : remote
    }
    const [localData, remoteData] = await Promise.all([
        openData<Opened>(key, local),
        openData<Opened>(key, remote),
    ])
    if (halves(localData) && halves(remoteData))
        return mergeHalves(
            key,
            { record: local, data: localData },
            { record: remote, data: remoteData },
        )
    // An everything lock leaves no `steam` to graft: the later user edit (a lock is one) takes the whole record.
    const [mine, theirs] = [editedAt(localData), editedAt(remoteData)]
    if (mine !== undefined && theirs !== undefined && mine !== theirs)
        return mine > theirs ? local : remote
    return local.updatedAt > remote.updatedAt ? local : remote
}

/** Merges two copies of one vault record by record; merging the result again with either side changes nothing.
 *  A tie goes to a tombstone, then to `remote`. */
export async function mergeRecords(
    key: VaultKey,
    local: readonly SealedRecord[],
    remote: readonly SealedRecord[],
): Promise<MergedRecords> {
    const remoteById = new Map(remote.map((record) => [record.id, record]))
    const toLocal: SealedRecord[] = []
    let toRemote = false
    for (const record of local) {
        const other = remoteById.get(record.id)
        remoteById.delete(record.id)
        if (!other) {
            toRemote = true
            continue
        }
        const merged = await mergeOne(key, record, other)
        if (!identical(merged, record)) toLocal.push(merged)
        if (!identical(merged, other)) toRemote = true
    }
    toLocal.push(...remoteById.values())
    return { toLocal, toRemote }
}
