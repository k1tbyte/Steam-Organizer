/** Where autofill runs: the content script's `matches` and the sender check read this one list. */
export const STEAM_LOGIN_MATCHES = [
    'https://store.steampowered.com/login*',
    'https://steamcommunity.com/login*',
    'https://help.steampowered.com/*/wizard/Login*',
]

const escaped = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
const PATTERNS = STEAM_LOGIN_MATCHES.map(
    (pattern) => new RegExp(`^${pattern.split('*').map(escaped).join('.*')}$`),
)

/** Whether a page URL falls under the content script's `matches`: scheme, host and path (with the query, without the fragment). */
export function isSteamLoginUrl(url: string | undefined): boolean {
    if (!url) return false
    try {
        const { origin, pathname, search } = new URL(url)
        return PATTERNS.some((pattern) =>
            pattern.test(`${origin}${pathname}${search}`),
        )
    } catch {
        return false
    }
}
