import type { PickerAccount } from '#features/quick-access'

/** The vault session as the injected UI reads it. */
export type AutofillState = 'new' | 'locked' | 'unlocked'

/** Content script -> vault host. The tab is the sender's, never a field of the message. */
export type AutofillRequest =
    | { type: 'autofill:state' }
    | { type: 'autofill:login'; id: string }
    | { type: 'autofill:code'; id: string }
    /** A fill the popup made on this tab, for the Guard prompt that follows. */
    | { type: 'autofill:filled'; id: string }

/** Why the host gave nothing: the vault is locked, the account has its own password, the account is gone (or has no
 *  authenticator for a code). */
export type Refusal = 'locked' | 'account-locked' | 'gone'
export interface Refused {
    refused: Refusal
}

export interface StateAnswer {
    state: AutofillState
    /** What the picker renders and searches; empty unless the vault is unlocked. */
    accounts: PickerAccount[]
    /** The account last filled on this tab, else the first with an authenticator. */
    guardFor?: string
}

export type LoginAnswer = { login: string; password: string } | Refused
export type CodeAnswer = { code: string } | Refused

/** The host's side of a request: the message as received and the id of the tab it came from. */
export type HostHandler = (message: unknown, tabId: number) => Promise<unknown>

/** The shell's transport for the host: registers the handler, returns the unregister. */
export type VaultHostServe = (handler: HostHandler) => () => void
