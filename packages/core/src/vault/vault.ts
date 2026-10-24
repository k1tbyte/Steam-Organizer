import {
    createKeys,
    type PasswordSlot,
    rewrapSlot,
    unlockSlot,
    type VaultKey,
} from '../crypto/keys'
import { openText, type Sealed, sealText } from '../crypto/seal'
import { UnsupportedVaultError } from '../errors'

export const VAULT_FORMAT = 'steam-organizer-vault'

/** The standalone container: without the password only the format, the vault id and the slot read. */
export interface VaultFile {
    format: typeof VAULT_FORMAT
    version: 1
    id: string
    slots: { password: PasswordSlot }
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
    const { slot, key } = await createKeys(password)
    const file: VaultFile = {
        format: VAULT_FORMAT,
        version: 1,
        id: crypto.randomUUID(),
        slots: { password: slot },
        body: '',
    }
    return { file: await writeRecords(key, file, []), key }
}

export async function unlockVault(
    file: VaultFile,
    password: string,
): Promise<VaultKey> {
    if (file.format !== VAULT_FORMAT || file.version !== 1)
        throw new UnsupportedVaultError()
    return unlockSlot(file.slots.password, password)
}

/** Rewraps the password slot; once locked accounts exist, their recovery slots too, so more than the slot may change. */
export async function changePassword(
    file: VaultFile,
    oldPassword: string,
    newPassword: string,
): Promise<VaultFile> {
    const password = await rewrapSlot(
        file.slots.password,
        oldPassword,
        newPassword,
    )
    return { ...file, slots: { ...file.slots, password } }
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

export async function sealRecord<Data, Secret>(
    key: VaultKey,
    record: OpenRecord<Data, Secret>,
): Promise<LiveRecord> {
    const { id, updatedAt } = record
    const seal = (value: unknown, part: 'data' | 'secret') =>
        sealText(key.records, JSON.stringify(value), partAad(id, part))
    const data = await seal(record.data, 'data')
    if (record.secret === undefined) return { id, updatedAt, data }
    return { id, updatedAt, data, secret: await seal(record.secret, 'secret') }
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
): Promise<Secret | undefined> {
    if (record.secret === undefined) return undefined
    return JSON.parse(
        await openText(
            key.records,
            record.secret,
            partAad(record.id, 'secret'),
        ),
    )
}
