/** What the active browser tab asks of the popup: a Steam sign-in form, a Steam Guard prompt, or nothing. */
export type TabKind = 'signin' | 'guard' | 'other'

export interface TabContext {
    kind: TabKind
    /** Host and path, as the banner prints it. */
    address: string
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
