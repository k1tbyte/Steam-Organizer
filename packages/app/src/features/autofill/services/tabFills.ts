/** The account last filled on a tab: an id, not a secret, bound to the session (`sessionBound`). The background
 *  removes it when the tab closes. */
export const tabFillKey = (tab: number) => `so:autofill:tab:${tab}`
