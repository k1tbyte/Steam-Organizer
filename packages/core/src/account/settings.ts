import type { VaultKey } from '../crypto/keys'
import {
    type LiveRecord,
    openData,
    openSecret,
    type SealedRecord,
    sealRecord,
} from '../vault/vault'
import {
    FIELD_DEFAULTS,
    type FieldPlacement,
    MOVABLE_FIELDS,
    type Movable,
    type MovableField,
    RECORD,
} from './records'

/** The vault's one SETTINGS record: a fixed id, so copies from two devices merge instead of doubling. */
export const SETTINGS_ID = 'settings'

export type FieldDefaults = Record<MovableField, FieldPlacement>

export interface SettingsData {
    kind: typeof RECORD.SETTINGS
    fieldDefaults: FieldDefaults
    /** A placement change is still moving fields: set before the first account, cleared after the last. */
    moving?: boolean
}

export interface SettingsSecret {
    steamApiKey?: string
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

export function readSettingsSecret(value: unknown): SettingsSecret {
    const { steamApiKey, ...rest } = isObject(value) ? value : {}
    return typeof steamApiKey === 'string' ? { ...rest, steamApiKey } : rest
}

/** The settings record with this Steam Web API key in its secret ('' removes it); its data stays as stored. */
export async function withSteamKey(
    key: VaultKey,
    record: SealedRecord | undefined,
    steamApiKey: string,
): Promise<LiveRecord> {
    const live = record && !('deleted' in record) ? record : undefined
    const secret = live && (await openSecret(key, live))
    return sealRecord(key, {
        id: SETTINGS_ID,
        updatedAt: Date.now(),
        data: live ? await openData(key, live) : readSettings(undefined),
        secret: {
            ...readSettingsSecret(secret),
            steamApiKey: steamApiKey || undefined,
        },
    })
}

/** A vault without the record, or a field it does not name, reads as the defaults. */
export function readSettings(value: unknown): SettingsData {
    const stored =
        isObject(value) && value.kind === RECORD.SETTINGS ? value : {}
    const defaults = isObject(stored.fieldDefaults) ? stored.fieldDefaults : {}
    return {
        ...stored,
        kind: RECORD.SETTINGS,
        fieldDefaults: Object.fromEntries(
            MOVABLE_FIELDS.map((field) => [
                field,
                defaults[field] === 'secret' || defaults[field] === 'searchable'
                    ? defaults[field]
                    : FIELD_DEFAULTS[field],
            ]),
        ) as FieldDefaults,
    }
}

/** Moves every movable field into the part its placement names; `moved` is false when both already fit. */
export function placeFields<Data extends Movable, Secret extends Movable>(
    data: Data,
    secret: Secret,
    placement: FieldDefaults,
): { data: Data; secret: Secret; moved: boolean } {
    const nextData: Movable = { ...data }
    const nextSecret: Movable = { ...secret }
    let moved = false
    for (const field of MOVABLE_FIELDS) {
        const [from, to] =
            placement[field] === 'secret'
                ? [nextData, nextSecret]
                : [nextSecret, nextData]
        const value = from[field]
        if (value === undefined) continue
        delete from[field]
        // A value on both sides (a copy merged from another device) keeps the one already in place.
        to[field] ??= value
        moved = true
    }
    return { data: nextData as Data, secret: nextSecret as Secret, moved }
}
