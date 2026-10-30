import {
    addRecovery,
    createKeys,
    importRecovery,
    rewrapSlots,
    unlockSlot,
    type VaultKey,
    type VaultSlots,
} from '../crypto/keys'
import { openText, type Sealed, sealText } from '../crypto/seal'
import { UnsupportedVaultError } from '../errors'

export const VAULT_FORMAT = 'steam-organizer-vault'

/** The standalone container: without the password only the format, the vault id and the slot read. */
export interface VaultFile {
    format: typeof VAULT_FORMAT
    version: 1
    id: string
    slots: VaultSlots
    /** JSONL of `SealedRecord`. */
    body: Sealed
}

interface Stamp {
    id: string
    updatedAt: number
}

export interface LiveRecord extends Stamp {
    data: Sealed
    secret?: Sealed
}

/** Kept so a sync tells a deletion from a record another copy never had. */
export interface Tombstone extends Stamp {
    deleted: true
}

export type SealedRecord = LiveRecord | Tombstone

export interface OpenRecord<Data, Secret> extends Stamp {
    data: Data
    secret?: Secret
}

const bodyAad = (file: VaultFile) => `${file.id}\0body`
const partAad = (id: string, part: 'data' | 'secret') => `${id}\0${part}`

export async function createVault(
    password: string,
): Promise<{ file: VaultFile; key: VaultKey }> {
    const { slots, key } = await createKeys(password)
    const file: VaultFile = {
        format: VAULT_FORMAT,
        version: 1,
        id: crypto.randomUUID(),
        slots,
        body: '',
    }
    return { file: await writeRecords(key, file, []), key }
}

/** A vault file from outside (a backup, an import): a newer format or a damaged file refuses. */
export function parseVaultFile(text: string): VaultFile {
    let file: Partial<VaultFile> | null
    try {
        file = JSON.parse(text)
    } catch {
        throw new UnsupportedVaultError()
    }
    const valid =
        file?.format === VAULT_FORMAT &&
        file.version === 1 &&
        typeof file.id === 'string' &&
        typeof file.body === 'string' &&
        typeof file.slots?.password === 'object'
    if (!valid) throw new UnsupportedVaultError()
    return file as VaultFile
}

export async function unlockVault(
    file: VaultFile,
    password: string,
): Promise<VaultKey> {
    if (file.format !== VAULT_FORMAT || file.version !== 1)
        throw new UnsupportedVaultError()
    const key = await unlockSlot(file.slots.password, password)
    const { recovery } = file.slots
    return recovery ? { ...key, recovery: await importRecovery(recovery) } : key
}

/** A vault made before recovery slots gets one at a master-password unlock; null when it has one. */
export async function withRecovery(
    file: VaultFile,
    key: VaultKey,
    password: string,
): Promise<{ file: VaultFile; key: VaultKey } | null> {
    if (file.slots.recovery) return null
    const recovery = await addRecovery(file.slots, password)
    return {
        file: { ...file, slots: { ...file.slots, recovery } },
        key: { ...key, recovery: await importRecovery(recovery) },
    }
}

/** Rewraps both slots; the recovery pair carries over, so locked accounts' recovery slots stay as they are. */
export async function changePassword(
    file: VaultFile,
    oldPassword: string,
    newPassword: string,
): Promise<VaultFile> {
    return {
        ...file,
        slots: await rewrapSlots(file.slots, oldPassword, newPassword),
    }
}

export async function readRecords(
    key: VaultKey,
    file: VaultFile,
): Promise<SealedRecord[]> {
    const body = await openText(key.records, file.body, bodyAad(file))
    return body ? body.split('\n').map(parseRecord) : []
}

export async function writeRecords(
    key: VaultKey,
    file: VaultFile,
    records: readonly SealedRecord[],
): Promise<VaultFile> {
    const body = records.map((record) => JSON.stringify(record)).join('\n')
    return { ...file, body: await sealText(key.records, body, bodyAad(file)) }
}

// A record this version cannot read stops the read: skipping it would drop it at the next write.
function parseRecord(line: string): SealedRecord {
    const record = JSON.parse(line) as Partial<LiveRecord & Tombstone>
    const stamped =
        typeof record.id === 'string' && typeof record.updatedAt === 'number'
    const sealed = (part: unknown) => typeof part === 'string'
    const live =
        sealed(record.data) &&
        (record.secret === undefined || sealed(record.secret)) &&
        record.deleted === undefined
    const gone =
        record.deleted === true &&
        record.data === undefined &&
        record.secret === undefined
    if (stamped && (live || gone)) return record as SealedRecord
    throw new UnsupportedVaultError()
}

/** `accountKey` seals a locked account's secret; the data part stays under the vault key. */
export async function sealRecord<Data, Secret>(
    key: VaultKey,
    record: OpenRecord<Data, Secret>,
    accountKey = key.records,
): Promise<LiveRecord> {
    const { id, updatedAt } = record
    const data = await sealText(
        key.records,
        JSON.stringify(record.data),
        partAad(id, 'data'),
    )
    if (record.secret === undefined) return { id, updatedAt, data }
    const secret = await sealText(
        accountKey,
        JSON.stringify(record.secret),
        partAad(id, 'secret'),
    )
    return { id, updatedAt, data, secret }
}

/** Reseals the data part only: a pin, a move or an alias edit never opens the secret. */
export async function updateData<Data>(
    key: VaultKey,
    record: LiveRecord,
    data: Data,
    updatedAt: number,
): Promise<LiveRecord> {
    const sealed = await sealText(
        key.records,
        JSON.stringify(data),
        partAad(record.id, 'data'),
    )
    return { ...record, updatedAt, data: sealed }
}

export async function openData<Data>(
    key: VaultKey,
    record: LiveRecord,
): Promise<Data> {
    return JSON.parse(
        await openText(key.records, record.data, partAad(record.id, 'data')),
    )
}

export async function openSecret<Secret>(
    key: VaultKey,
    record: LiveRecord,
    accountKey = key.records,
): Promise<Secret | undefined> {
    if (record.secret === undefined) return undefined
    return JSON.parse(
        await openText(accountKey, record.secret, partAad(record.id, 'secret')),
    )
}
