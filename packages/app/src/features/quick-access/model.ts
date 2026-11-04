import type { Account } from '#features/accounts'

/** What the picker renders and searches, nothing more (no notes, phone, email or Steam snapshot): the injected UI
 *  gets only these from the vault host. A locked account's login is empty, as in the app. */
export type PickerAccount = Pick<
    Account,
    | 'id'
    | 'nickname'
    | 'login'
    | 'avatar'
    | 'hue'
    | 'level'
    | 'guard'
    | 'locked'
    | 'pinned'
    | 'anonymous'
>

/** What the active browser tab asks of the popup: a Steam sign-in form, a Steam Guard prompt, or nothing. */
export type TabKind = 'signin' | 'guard' | 'other'

export interface TabContext {
    kind: TabKind
    /** Host and path, as the banner prints it. */
    address: string
}

/** Popup -> the content script of the active tab (`Platform.activeTab`). No receiver means `other`. */
export type TabRequest =
    | { type: 'tab:context' }
    | { type: 'tab:fill-login'; id: string; login: string; password: string }
    | { type: 'tab:fill-code'; code: string }

/** The answer to a fill: whether the page had the fields to put it in. */
export interface TabFillAnswer {
    filled: boolean
}

/** Row heights in px: PickerRow's height and the step the list windows by. */
export const ROW_PX = { regular: 52, compact: 46 } as const

/** Vertical room above and below the rows, in px; PickerList's mx-1.5 and mx-1 are the sides. */
export const LIST_INSET_PX = {
    regular: { start: 2, end: 6 },
    compact: { start: 4, end: 4 },
} as const

export const LISTBOX_ID = 'quick-access-accounts'

/** The listbox option's id, so the search field can name the selected row. */
export const optionId = (accountId: string) => `account-option-${accountId}`

/** Stands in for a locked account's login and password wherever they would show. */
export const SECRET_MASK = '••••••'
