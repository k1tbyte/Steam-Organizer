import {
    type AccountSecret,
    type LiveRecord,
    openSecret,
    placeFields,
    readAccount,
    readSettings,
    SETTINGS_ID,
    sealRecord,
    type VaultKey,
} from '@so/core'

interface Contents {
    data: ReadonlyMap<string, unknown>
}

/** The account record resealed with its movable fields where the vault's placement (read from `contents`) puts them;
 *  null when they already are, or the account is locked. `data` defaults to the record's own as `contents` holds it. */
export async function placedRecord(
    key: VaultKey,
    contents: Contents,
    record: LiveRecord,
    data = readAccount(contents.data.get(record.id)),
    updatedAt = Date.now(),
): Promise<LiveRecord | null> {
    // A locked account keeps every movable field sealed already, under a key this vault key cannot open.
    if (!data || data.lock) return null
    const secret = (await openSecret<AccountSecret>(key, record)) ?? {
        password: '',
        services: [],
    }
    const placement = readSettings(contents.data.get(SETTINGS_ID)).fieldDefaults
    const placed = placeFields(data, secret, placement)
    if (!placed.moved) return null
    return sealRecord(key, {
        id: record.id,
        updatedAt,
        data: placed.data,
        secret: placed.secret,
    })
}
