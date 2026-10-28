import type { OwnedGame } from '@so/core'

/** `price` in hundredths: null for a free or unsold game, undefined while the store has not priced it. */
export interface LibraryGame extends OwnedGame {
    price: number | null | undefined
}

/** An account's cached games; null while its profile hides them. */
export interface Library {
    games: LibraryGame[] | null
}

export type GameSort = 'playtime' | 'recent' | 'name' | 'price'
export type GameFilter = 'all' | 'played' | 'unplayed'
export interface GameOrder {
    by: GameSort
    dir: 1 | -1
}

/** A column's first click: the most played, most recent and priciest on top, names from A. */
export const FIRST_DIR: Record<GameSort, 1 | -1> = {
    playtime: -1,
    recent: -1,
    name: 1,
    price: -1,
}

const collator = new Intl.Collator(undefined, {
    sensitivity: 'base',
    numeric: true,
})

// An unpriced game sorts below a free one.
const NUMBERS: Record<
    Exclude<GameSort, 'name'>,
    (game: LibraryGame) => number
> = {
    playtime: (game) => game.minutes,
    recent: (game) => game.recentMinutes,
    price: (game) => game.price ?? (game.price === null ? 0 : -1),
}

/** The games matching `query` and `filter` in `order`; ties go by name. */
export function listGames(
    games: readonly LibraryGame[],
    query: string,
    filter: GameFilter,
    order: GameOrder,
): LibraryGame[] {
    const needle = query.trim().toLocaleLowerCase()
    const byName = (a: LibraryGame, b: LibraryGame) =>
        collator.compare(a.name, b.name)
    const number = order.by === 'name' ? null : NUMBERS[order.by]
    const compare = number
        ? (a: LibraryGame, b: LibraryGame) => number(a) - number(b)
        : byName
    return games
        .filter(
            (game) =>
                (filter === 'all' ||
                    (filter === 'played') === game.minutes > 0) &&
                (needle === '' ||
                    game.name.toLocaleLowerCase().includes(needle)),
        )
        .sort((a, b) => compare(a, b) * order.dir || byName(a, b))
}
