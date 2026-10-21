import type { Account } from '#features/accounts'

/** Pinned first, then the rest in vault order; the query matches nickname and login. */
export function rankAccounts(
    accounts: readonly Account[],
    query: string,
): Account[] {
    const needle = query.trim().toLowerCase()
    const found = accounts.filter(
        (account) =>
            needle === '' ||
            account.nickname.toLowerCase().includes(needle) ||
            // A locked account keeps its login out of search.
            (!account.locked && account.login.toLowerCase().includes(needle)),
    )
    return [...found.filter((a) => a.pinned), ...found.filter((a) => !a.pinned)]
}

/** A key press the palette leaves alone: an IME composing, or a focused button that needs Enter for itself. */
export function isPaletteKeyIgnored(event: {
    isComposing: boolean
    target: unknown
}) {
    const target = event.target as { closest?: (selector: string) => unknown }
    return event.isComposing || Boolean(target?.closest?.('button'))
}

/** The selection moved by `step`, wrapping at both ends. */
export function stepSelection(index: number, step: number, count: number) {
    if (count === 0) return 0
    return (((index + step) % count) + count) % count
}

/** A selection kept inside a list that shrank under it. */
export function clampSelection(index: number, count: number) {
    return Math.min(index, Math.max(0, count - 1))
}
