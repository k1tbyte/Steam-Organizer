import type { PickerAccount } from '#features/quick-access'

import type {
    AutofillRequest,
    CodeAnswer,
    LoginAnswer,
    Refusal,
    StateAnswer,
} from '../model'

const STATES = ['new', 'locked', 'unlocked'] as const
const REFUSALS: readonly Refusal[] = ['locked', 'account-locked', 'gone']

const fieldsOf = (value: unknown): Record<string, unknown> =>
    typeof value === 'object' && value !== null
        ? (value as Record<string, unknown>)
        : {}
const text = (value: unknown) => (typeof value === 'string' ? value : '')
const count = (value: unknown) => (typeof value === 'number' ? value : 0)

/** What the host takes from the content script: a known type, and an id where it needs one. */
export function parseRequest(message: unknown): AutofillRequest | undefined {
    const { type, id } = fieldsOf(message)
    if (type === 'autofill:state') return { type }
    if (typeof id !== 'string' || id === '') return undefined
    if (
        type === 'autofill:login' ||
        type === 'autofill:code' ||
        type === 'autofill:filled'
    )
        return { type, id }
    return undefined
}

function readRow(row: unknown): PickerAccount | undefined {
    const found = fieldsOf(row)
    if (typeof found.id !== 'string' || typeof found.nickname !== 'string')
        return undefined
    // Rebuilt field by field: whatever else an answer carries never reaches the picker.
    return {
        id: found.id,
        nickname: found.nickname,
        login: text(found.login),
        ...(typeof found.avatar === 'string' && { avatar: found.avatar }),
        hue: count(found.hue),
        level: count(found.level),
        guard: found.guard === true,
        locked: found.locked === true,
        pinned: found.pinned === true,
        anonymous: found.anonymous === true,
    }
}

export function readState(answer: unknown): StateAnswer | undefined {
    const { state, accounts, guardFor } = fieldsOf(answer)
    const known = STATES.find((name) => name === state)
    if (!known) return undefined
    return {
        state: known,
        accounts: Array.isArray(accounts)
            ? accounts.flatMap((row) => readRow(row) ?? [])
            : [],
        ...(typeof guardFor === 'string' && { guardFor }),
    }
}

function refusalOf(answer: Record<string, unknown>) {
    return REFUSALS.find((refusal) => refusal === answer.refused)
}

export function readLogin(answer: unknown): LoginAnswer | undefined {
    const found = fieldsOf(answer)
    const refused = refusalOf(found)
    if (refused) return { refused }
    return typeof found.login === 'string' && typeof found.password === 'string'
        ? { login: found.login, password: found.password }
        : undefined
}

export function readCode(answer: unknown): CodeAnswer | undefined {
    const found = fieldsOf(answer)
    const refused = refusalOf(found)
    if (refused) return { refused }
    return typeof found.code === 'string' ? { code: found.code } : undefined
}
