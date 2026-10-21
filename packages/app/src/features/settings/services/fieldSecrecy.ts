import { FIXED_SECRET_KEYS, type FieldKey, type FieldModes } from '../model'

/** Row order in the fields section. */
export const FIELD_KEYS: readonly FieldKey[] = [
    'nickname',
    'login',
    'note',
    'phone',
    'email',
    'password',
    'linked',
    'auth',
]

const FIXED_SECRET: ReadonlySet<FieldKey> = new Set(FIXED_SECRET_KEYS)

export function isFixedSecret(key: FieldKey): boolean {
    return FIXED_SECRET.has(key)
}

export function isSecret(key: FieldKey, modes: FieldModes): boolean {
    return isFixedSecret(key) || modes[key as keyof FieldModes] === 'secret'
}

export function secretCount(
    keys: readonly FieldKey[],
    modes: FieldModes,
): number {
    return keys.filter((key) => isSecret(key, modes)).length
}
