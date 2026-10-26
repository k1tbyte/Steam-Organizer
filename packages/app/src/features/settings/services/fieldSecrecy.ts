import {
    type FieldDefaults,
    type FieldPlacement,
    MOVABLE_FIELDS,
    type MovableField,
} from '@so/core'

import { FIXED_FIELDS, type FieldKey } from '../model'

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

export const isFixed = (key: FieldKey): key is keyof typeof FIXED_FIELDS =>
    key in FIXED_FIELDS

export function placementOf(
    key: FieldKey,
    placement: FieldDefaults,
): FieldPlacement {
    return isFixed(key) ? FIXED_FIELDS[key] : placement[key]
}

export const secretCount = (
    keys: readonly FieldKey[],
    placement: FieldDefaults,
) => keys.filter((key) => placementOf(key, placement) === 'secret').length

/** The fields a new placement moves, by where they go. */
export function placementMoves(from: FieldDefaults, to: FieldDefaults) {
    const moved = MOVABLE_FIELDS.filter((field) => from[field] !== to[field])
    const going = (placement: FieldPlacement): MovableField[] =>
        moved.filter((field) => to[field] === placement)
    return {
        moved,
        toSecret: going('secret'),
        toSearchable: going('searchable'),
    }
}
