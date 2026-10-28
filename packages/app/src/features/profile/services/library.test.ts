import { expect, it } from 'vitest'

import { type LibraryGame, listFriends, listGames } from './library'

const game = (
    name: string,
    minutes: number,
    price: number | null | undefined,
    recentMinutes = 0,
): LibraryGame => ({
    appId: name.length,
    name,
    icon: '',
    minutes,
    recentMinutes,
    price,
})

const games = [
    game('Portal 2', 1320, 999),
    game('Dota 2', 9000, null, 30),
    game('Elden Ring', 0, 5999),
    game('Rust', 9000, undefined, 600),
]
const names = (list: LibraryGame[]) => list.map((found) => found.name)

it('filters by playtime and by a case-insensitive name', () => {
    const order = { by: 'name', dir: 1 } as const
    expect(names(listGames(games, '', 'unplayed', order))).toEqual([
        'Elden Ring',
    ])
    expect(names(listGames(games, ' 2', 'played', order))).toEqual([
        'Dota 2',
        'Portal 2',
    ])
    expect(listGames(games, 'RUST', 'all', order)).toHaveLength(1)
})

it('sorts by a column either way, ties by name, an unpriced game below a free one', () => {
    expect(
        names(listGames(games, '', 'all', { by: 'playtime', dir: -1 })),
    ).toEqual(['Dota 2', 'Rust', 'Portal 2', 'Elden Ring'])
    expect(
        names(listGames(games, '', 'all', { by: 'recent', dir: -1 })),
    ).toEqual(['Rust', 'Dota 2', 'Elden Ring', 'Portal 2'])
    expect(
        names(listGames(games, '', 'all', { by: 'price', dir: -1 })),
    ).toEqual(['Elden Ring', 'Portal 2', 'Dota 2', 'Rust'])
    expect(names(listGames(games, '', 'all', { by: 'name', dir: -1 }))).toEqual(
        ['Rust', 'Portal 2', 'Elden Ring', 'Dota 2'],
    )
})

const friend = (nickname: string, since: number | null) => ({
    steamId: nickname.toLowerCase(),
    since,
    nickname,
    avatar: '',
})
const friends = [
    friend('bravo', 100),
    friend('Alpha', null),
    friend('charlie', 300),
    friend('Delta', 300),
]

it('lists friends by the newest friendship or by name, those in the vault apart', () => {
    const nicknames = (
        sort: 'since' | 'name',
        filter: 'all' | 'vault' = 'all',
    ) =>
        listFriends(friends, '', filter, sort, (id) => id !== 'bravo').map(
            (found) => found.nickname,
        )
    expect(nicknames('since')).toEqual(['charlie', 'Delta', 'bravo', 'Alpha'])
    expect(nicknames('name')).toEqual(['Alpha', 'bravo', 'charlie', 'Delta'])
    expect(nicknames('name', 'vault')).toEqual(['Alpha', 'charlie', 'Delta'])
    expect(
        listFriends(friends, 'DEL', 'all', 'name', () => false),
    ).toHaveLength(1)
})
