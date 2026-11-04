import { isSteamLoginUrl } from './steamPages'

/** The part of `runtime.MessageSender` the checks read. */
export interface Sender {
    id?: string
    frameId?: number
    url?: string
    tab?: { id?: number }
}

/** The tab of a message from this extension's content script on a Steam login page, in its top frame; else
 *  `undefined` and the message goes unanswered. A web page cannot reach `runtime.onMessage` at all. */
export function autofillTabId(
    sender: Sender,
    extensionId: string,
): number | undefined {
    const tab = sender.tab?.id
    if (
        sender.id !== extensionId ||
        tab === undefined ||
        sender.frameId !== 0 ||
        !isSteamLoginUrl(sender.url)
    )
        return undefined
    return tab
}

/** A message from one of this extension's own pages (the popup, the background, the host), not a content script. */
export const isExtensionPage = (sender: Sender, extensionId: string) =>
    sender.id === extensionId && sender.tab === undefined
