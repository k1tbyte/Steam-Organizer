/** A content script cannot open tabs, so it asks the background to open the full app. */
export interface OpenAppMessage {
    type: 'open-app'
    path: string
}

export function isOpenAppMessage(message: unknown): message is OpenAppMessage {
    const { type, path } = (message ?? {}) as Partial<OpenAppMessage>
    return (
        type === 'open-app' && typeof path === 'string' && path.startsWith('/')
    )
}

/** An `autofill:*` message from a content script (the app's `features/autofill` owns their shapes). */
export const isAutofillMessage = (message: unknown) =>
    typeof (message as { type?: unknown } | null)?.type === 'string' &&
    (message as { type: string }).type.startsWith('autofill:')

/** Chrome: the background forwards an autofill message to the offscreen host with the sender's tab. */
export interface VaultHostMessage {
    type: 'vault-host'
    tabId: number
    message: unknown
}

export function isVaultHostMessage(
    message: unknown,
): message is VaultHostMessage {
    const { type, tabId } = (message ?? {}) as Partial<VaultHostMessage>
    return type === 'vault-host' && typeof tabId === 'number'
}

/** Chrome: the offscreen host has no `storage.session`, so its session area is these requests to the background. */
export type SessionRelayMessage =
    | { type: 'session-relay'; op: 'get' | 'remove'; key: string }
    | { type: 'session-relay'; op: 'set'; key: string; value: string }

export function isSessionRelay(
    message: unknown,
): message is SessionRelayMessage {
    const { type, op, key, value } = (message ?? {}) as Record<string, unknown>
    return (
        type === 'session-relay' &&
        typeof key === 'string' &&
        key.startsWith('so:') &&
        (op === 'get' ||
            op === 'remove' ||
            (op === 'set' && typeof value === 'string'))
    )
}

/** The background tells the offscreen host about a `storage.session` change, which it cannot hear itself. */
export interface SessionChangedMessage {
    type: 'session-changed'
    key: string
    value?: string
}

export function isSessionChanged(
    message: unknown,
): message is SessionChangedMessage {
    const { type, key } = (message ?? {}) as Partial<SessionChangedMessage>
    return type === 'session-changed' && typeof key === 'string'
}
