import {
    type ServiceCredentials,
    type SteamFriend,
    toSteamId64,
} from '@so/core'
import { defineMock } from '#core'
import type { Account } from '#features/accounts'

import type { CredentialField, CredentialKind, ProfileData } from './model'
import type { Library, LibraryGame } from './services/library'

/** One variant edits what the open account shows: its profile data, and the account fields the sections depend on. */
export interface ProfileSample {
    details?: (base: ProfileData) => ProfileData
    account?: Partial<Pick<Account, 'bans' | 'guard'>>
}

/** Stands in for an account's own password; the vault would check a key derived from it. */
export const DEMO_ACCOUNT_PASSWORD = 'demo'

const DAY_MS = 86_400_000

function fields(...pairs: [CredentialKind, string][]): CredentialField[] {
    return pairs.map(([kind, value]) => ({ kind, value }))
}

const linked = (
    service: string,
    ...pairs: [CredentialKind, string][]
): ServiceCredentials => ({ service, fields: fields(...pairs) })

const stats = (
    years: number,
    games: number,
    played: number,
    hours: number,
    paid: number,
    value: number,
    badge: string,
    friends: number,
) => ({
    years,
    games,
    played,
    hours,
    paid,
    value,
    currency: 'USD',
    badge,
    friends,
})

// The mockup's three profiles: a normal one, credentials locked with recovery, everything locked without.
const SAMPLE_PROFILES: Record<string, ProfileData> = {
    a1: {
        visibility: 'public',
        registered: Date.UTC(2020, 3, 27),
        vanity: 'kyzzdef',
        stats: stats(5, 140, 67, 13876, 103, 1498.87, '100+', 37),
        banDetails: {},
        lastBanAt: null,
        lock: null,
        revocationCode: 'R38214',
        credentials: {
            steam: fields(
                ['login', 'kyzzdef_1'],
                ['password', 'Tr4de-ready!2020'],
                ['phone', '+7 912 455-12-34'],
            ),
            linked: [
                linked(
                    'email',
                    ['email', 'kyzz.def@proton.me'],
                    ['password', 'mailbox-Orbit-77'],
                ),
                linked(
                    'ubisoft',
                    ['email', 'kyzz.def@proton.me'],
                    ['password', 'R6-siege-2021'],
                ),
                linked(
                    'rockstar',
                    ['login', 'kyzz_rsg'],
                    ['password', 'LosSantos#88'],
                    ['secret-word', 'tangerine'],
                ),
            ],
        },
    },
    a12: {
        visibility: 'friends',
        registered: Date.UTC(2022, 1, 14),
        vanity: null,
        stats: stats(4, 38, 21, 2410, 12, 214.4, '25+', 12),
        banDetails: {
            community: 'Since 12 Mar 2026',
            economy: 'Until 4 Dec 2026',
        },
        lastBanAt: Date.now() - 222 * DAY_MS,
        lock: { scope: 'credentials', recovery: true },
        revocationCode: null,
        credentials: {
            steam: fields(
                ['login', 'dorado_trades'],
                ['password', 'gold-Coast_19'],
                ['phone', '+7 903 118-40-07'],
            ),
            linked: [
                linked(
                    'email',
                    ['email', 'dorado.tr@gmail.com'],
                    ['password', 'inbox!Dorado'],
                ),
            ],
        },
    },
    a8: {
        visibility: 'public',
        registered: Date.UTC(2020, 6, 9),
        vanity: 'starwave',
        stats: stats(5, 212, 180, 4102, 9, 96.1, '100+', 3),
        banDetails: {},
        lastBanAt: null,
        lock: { scope: 'everything', recovery: false },
        revocationCode: 'R70926',
        credentials: {
            steam: fields(
                ['login', 'starwave_farm'],
                ['password', 'Cards4ever-34'],
            ),
            linked: [],
        },
    },
}

/** A stable number per account, so a derived profile looks the same on every visit. */
function seedOf(id: string): number {
    return [...id].reduce((h, char) => (h * 31 + char.charCodeAt(0)) >>> 0, 7)
}

/** A profile for an account the mockup gives none: plausible numbers from its level and age. */
function derive(account: Account): ProfileData {
    const seed = seedOf(account.id)
    const games = account.anonymous ? 0 : 12 + account.level * 4 + (seed % 30)
    const played = Math.round(games * (0.35 + (seed % 50) / 100))
    return {
        visibility: ['public', 'friends', 'private'][
            seed % 3
        ] as ProfileData['visibility'],
        registered: Date.parse(`1 ${account.since}`) || null,
        vanity:
            account.anonymous || seed % 3 === 0
                ? null
                : account.nickname.toLowerCase().replace(/\W+/g, ''),
        stats: stats(
            Math.floor(account.years),
            games,
            played,
            played * 38,
            Math.round(games * 0.4),
            games * 9.5,
            account.level >= 50 ? '100+' : '25+',
            seed % 80,
        ),
        banDetails: {},
        lastBanAt:
            account.bans.length > 0
                ? Date.now() - (100 + (seed % 400)) * DAY_MS
                : null,
        lock:
            account.lock ??
            (account.locked ? { scope: 'credentials', recovery: true } : null),
        revocationCode: account.guard ? `R${10000 + (seed % 90000)}` : null,
        credentials: {
            steam: fields(
                ['login', account.login],
                ['password', `${account.login}-Pw!${seed % 100}`],
                ...(seed % 2 === 0
                    ? [
                          ['phone', '+7 900 000-00-00'] as [
                              CredentialKind,
                              string,
                          ],
                      ]
                    : []),
            ),
            linked: [],
        },
    }
}

/** The sample account's own profile, or a derived one. */
export function profileOf(account: Account): ProfileData {
    return SAMPLE_PROFILES[account.id] ?? derive(account)
}

export const profileMock = defineMock<ProfileSample>(
    'profile.details',
    'Profile details',
    {
        'Sample accounts': {},
        'Credentials locked, recovery on': {
            details: (base) => ({
                ...base,
                lock: { scope: 'credentials', recovery: true },
            }),
        },
        'Everything locked, no recovery': {
            details: (base) => ({
                ...base,
                lock: { scope: 'everything', recovery: false },
            }),
        },
        'No linked services': {
            details: (base) => ({
                ...base,
                credentials: { ...base.credentials, linked: [] },
            }),
        },
        'Active bans': {
            account: { bans: ['vac', 'community', 'economy'] },
            details: (base) => ({
                ...base,
                banDetails: {
                    vac: 'Since 3 Jun 2019',
                    economy: 'Until 4 Dec 2026',
                },
                lastBanAt: Date.now() - 222 * DAY_MS,
            }),
        },
        'No Steam Guard': { account: { guard: false } },
        'Private profile': {
            details: (base) => ({ ...base, visibility: 'private' }),
        },
    },
)

// The mockup's library: appid, name, hours, hours in the past two weeks, price.
const MOCKUP_GAMES: [number, string, number, number, number | null][] = [
    [730, 'Counter-Strike 2', 4210, 18.5, null],
    [570, 'Dota 2', 2880, 0, null],
    [252490, 'Rust', 1622, 9.2, 3999],
    [440, 'Team Fortress 2', 1204, 0, null],
    [359550, "Tom Clancy's Rainbow Six Siege", 920, 0, 1999],
    [271590, 'Grand Theft Auto V', 640, 0, 2999],
    [4000, "Garry's Mod", 530, 0, 999],
    [105600, 'Terraria', 410, 0, 999],
    [1245620, 'Elden Ring', 388, 0, 5999],
    [1091500, 'Cyberpunk 2077', 212, 0, 5999],
    [413150, 'Stardew Valley', 156, 3.1, 1499],
    [892970, 'Valheim', 98, 0, 1999],
    [1174180, 'Red Dead Redemption 2', 74, 0, 5999],
    [620, 'Portal 2', 22, 0, 999],
    [1086940, "Baldur's Gate 3", 0, 0, 5999],
    [289070, "Sid Meier's Civilization VI", 0, 0, 5999],
    [1172470, 'Apex Legends', 0, 0, null],
]

const sampleGame = ([
    appId,
    name,
    hours,
    recent,
    price,
]: (typeof MOCKUP_GAMES)[number]): LibraryGame => ({
    appId,
    name,
    icon: '',
    minutes: hours * 60,
    recentMinutes: recent * 60,
    price,
})

// The mockup's friends: nickname, friends since, the account ID of a sample account it is.
const MOCKUP_FRIENDS: [string, string, string?][] = [
    ['Halcyon_North', '2021-01', '38291044'],
    ['Starwave', '2020-07', '1122309841'],
    ['Lumen Drift', '2020-11'],
    ['vex', '2021-05'],
    ['frostbyte', '2023-02'],
    ['pashtet', '2022-06'],
    ['Dorado', '2022-02', '1402219980'],
    ['Okami_77', '2020-09'],
    ['Mollik', '2020-08', '318840219'],
    ['tofu', '2024-03'],
    ['Kestrel', '2021-04'],
    ['Marisol', '2023-12'],
]
const sampleFriends: SteamFriend[] = MOCKUP_FRIENDS.map(
    ([nickname, since, accountId], index) => ({
        steamId: toSteamId64(accountId ?? String(500_000 + index)),
        since: Date.parse(`${since}-01`),
        nickname,
        avatar: '',
    }),
)

export const libraryMock = defineMock<Library | null>(
    'profile.library',
    'Profile library',
    {
        'Mockup library': {
            games: MOCKUP_GAMES.map(sampleGame),
            friends: sampleFriends,
        },
        // Ids no store app has: rows stay unique and the tiles fall back to initials.
        'Two thousand games': {
            games: Array.from({ length: 2000 }, (_, index) => {
                const [, name, hours, recent, price] = MOCKUP_GAMES[
                    index % MOCKUP_GAMES.length
                ] as (typeof MOCKUP_GAMES)[number]
                return sampleGame([
                    90_000_000 + index,
                    `${name} ${index + 1}`,
                    (hours * (index % 7)) % 900,
                    recent,
                    price,
                ])
            }),
            friends: Array.from({ length: 2000 }, (_, index) => ({
                steamId: toSteamId64(String(600_000 + index)),
                since: Date.UTC(2015, 0, 1) + index * 86_400_000,
                nickname: `${MOCKUP_FRIENDS[index % MOCKUP_FRIENDS.length]?.[0]} ${index + 1}`,
                avatar: '',
            })),
        },
        'Empty library': { games: [], friends: [] },
        'Hidden library': { games: null, friends: null },
        'Not refreshed': null,
    },
)
