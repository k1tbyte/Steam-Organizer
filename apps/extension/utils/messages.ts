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
