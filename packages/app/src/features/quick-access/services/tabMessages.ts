import type { TabContext, TabFillAnswer, TabRequest } from '../model'

const fieldsOf = (value: unknown): Record<string, unknown> =>
    typeof value === 'object' && value !== null
        ? (value as Record<string, unknown>)
        : {}

/** What the content script takes from the popup: a known type with the fields it needs. */
export function parseTabRequest(message: unknown): TabRequest | undefined {
    const { type, id, login, password, code } = fieldsOf(message)
    if (type === 'tab:context') return { type }
    if (
        type === 'tab:fill-login' &&
        typeof id === 'string' &&
        typeof login === 'string' &&
        typeof password === 'string'
    )
        return { type, id, login, password }
    if (type === 'tab:fill-code' && typeof code === 'string')
        return { type, code }
    return undefined
}

/** The tab's answer to `tab:context`; none (no content script there) or anything else reads as another site. */
export function readTabContext(answer: unknown): TabContext {
    const { kind, address } = fieldsOf(answer)
    return (kind === 'signin' || kind === 'guard') &&
        typeof address === 'string'
        ? { kind, address }
        : { kind: 'other', address: '' }
}

export const readFilled = (answer: unknown): boolean =>
    (fieldsOf(answer) as Partial<TabFillAnswer>).filled === true
