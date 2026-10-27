import { type AccountData, type AccountSecret, MOVABLE_FIELDS } from './records'
import { type FieldDefaults, placeFields } from './settings'

/** All an `everything` lock leaves in the data part; the rest moves into `secret.hidden`. */
const KEPT = [
    'kind',
    'alias',
    'order',
    'pinned',
    'addedAt',
    'loginTag',
    'lock',
] as const satisfies (keyof AccountData)[]

// A locked account keeps every movable field sealed, whatever the vault's placement.
const ALL_SECRET = Object.fromEntries(
    MOVABLE_FIELDS.map((field) => [field, 'secret']),
) as FieldDefaults

/** The account whole: what an `everything` lock hid comes back to its data. */
export function joinAccount(data: AccountData, secret: AccountSecret) {
    const { hidden, ...rest } = secret
    return { data: { ...data, ...hidden } as AccountData, secret: rest }
}

/** What the data part of an account may hold: under an `everything` lock only `KEPT`, the list's face kept. */
export function publicData(data: AccountData): Partial<AccountData> {
    const { lock } = data
    if (lock?.scope !== 'everything') return data
    const kept = Object.fromEntries(
        KEPT.flatMap((field) => (field in data ? [[field, data[field]]] : [])),
    ) as Partial<AccountData>
    const shown = data.steam
        ? { nickname: data.steam.nickname, avatar: data.steam.avatar }
        : lock.shown
    return { ...kept, lock: { ...lock, ...(shown && { shown }) } }
}

/** A whole account split into its sealed parts; every writer holding the secret seals through it. */
export function splitAccount(
    data: AccountData,
    secret: AccountSecret,
    placement: FieldDefaults,
): { data: Partial<AccountData>; secret: AccountSecret } {
    const placed = placeFields(data, secret, data.lock ? ALL_SECRET : placement)
    if (data.lock?.scope !== 'everything') return placed
    const shown = publicData(placed.data)
    const hidden = Object.fromEntries(
        Object.entries(placed.data).filter(([field]) => !(field in shown)),
    ) as Partial<AccountData>
    return { data: shown, secret: { ...placed.secret, hidden } }
}
