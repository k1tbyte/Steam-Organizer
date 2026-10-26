import { defineMock } from '#core'
import type { Account } from '#features/accounts'

import {
    type CredentialField,
    type CredentialKind,
    type CredentialService,
    type ProfileData,
    STEAM_SERVICE,
} from './model'

/** One variant edits what the open account shows: its profile data, and the account fields the sections depend on. */
export interface ProfileSample {
    details?: (base: ProfileData) => ProfileData
    account?: Partial<Pick<Account, 'bans' | 'guard'>>
}

/** Stands in for an account's own password; the vault would check a key derived from it. */
export const DEMO_ACCOUNT_PASSWORD = 'demo'

function fields(...pairs: [CredentialKind, string][]): CredentialField[] {
    return pairs.map(([kind, value]) => ({ kind, value }))
}

function steam(...pairs: [CredentialKind, string][]): CredentialService {
    return { ...STEAM_SERVICE, fields: fields(...pairs) }
}

const stats = (
    years: number,
    games: number,
    played: number,
    hours: number,
    paid: number,
    value: number,
    badge: string,
    friends: number,
) => ({ years, games, played, hours, paid, value, badge, friends })

// The mockup's three profiles: a normal one, credentials locked with recovery, everything locked without.
const SAMPLE_PROFILES: Record<string, ProfileData> = {
    a1: {
        visibility: 'public',
        registered: Date.UTC(2020, 3, 27),
        vanity: 'kyzzdef',
        friendCode: 'AKGU4-XF2P',
        stats: stats(5, 140, 67, 13876, 103, 1498.87, '100+', 37),
        banDetails: {},
        lastBan: null,
        lock: null,
        revocationCode: 'R38214',
        services: [
            steam(
                ['login', 'kyzzdef_1'],
                ['password', 'Tr4de-ready!2020'],
                ['phone', '+7 912 455-12-34'],
            ),
            {
                key: 'email',
                label: 'Steam email',
                icon: 'icon-[lucide--mail]',
                fields: fields(
                    ['email', 'kyzz.def@proton.me'],
                    ['password', 'mailbox-Orbit-77'],
                ),
            },
            {
                key: 'ubi',
                label: 'Main',
                type: 'Ubisoft',
                icon: 'icon-[simple-icons--ubisoft]',
                fields: fields(
                    ['email', 'kyzz.def@proton.me'],
                    ['password', 'R6-siege-2021'],
                ),
            },
            {
                key: 'rock',
                label: 'Rockstar',
                icon: 'icon-[simple-icons--rockstargames]',
                fields: fields(
                    ['login', 'kyzz_rsg'],
                    ['password', 'LosSantos#88'],
                    ['secret-word', 'tangerine'],
                ),
            },
        ],
    },
    a12: {
        visibility: 'friends',
        registered: Date.UTC(2022, 1, 14),
        vanity: null,
        friendCode: 'B7RQK-ZJ3M',
        stats: stats(4, 38, 21, 2410, 12, 214.4, '25+', 12),
        banDetails: {
            community: 'Since 12 Mar 2026',
            economy: 'Until 4 Dec 2026',
        },
        lastBan: '222 days ago',
        lock: { scope: 'credentials', recovery: true },
        revocationCode: null,
        services: [
            steam(
                ['login', 'dorado_trades'],
                ['password', 'gold-Coast_19'],
                ['phone', '+7 903 118-40-07'],
            ),
            {
                key: 'email',
                label: 'Steam email',
                icon: 'icon-[lucide--mail]',
                fields: fields(
                    ['email', 'dorado.tr@gmail.com'],
                    ['password', 'inbox!Dorado'],
                ),
            },
        ],
    },
    a8: {
        visibility: 'public',
        registered: Date.UTC(2020, 6, 9),
        vanity: 'starwave',
        friendCode: 'QW2LD-8KXN',
        stats: stats(5, 212, 180, 4102, 9, 96.1, '100+', 3),
        banDetails: {},
        lastBan: null,
        lock: { scope: 'everything', recovery: false },
        revocationCode: 'R70926',
        services: [
            steam(['login', 'starwave_farm'], ['password', 'Cards4ever-34']),
        ],
    },
}

const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** A stable number per account, so a derived profile looks the same on every visit. */
function seedOf(id: string): number {
    return [...id].reduce((h, char) => (h * 31 + char.charCodeAt(0)) >>> 0, 7)
}

function friendCodeOf(seed: number): string {
    let rest = seed
    let code = ''
    for (let i = 0; i < 9; i++) {
        code += FRIEND_CODE_ALPHABET[rest % FRIEND_CODE_ALPHABET.length]
        rest = Math.imul(rest ^ (rest >>> 7), 2654435761) >>> 0
    }
    return `${code.slice(0, 5)}-${code.slice(5)}`
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
        registered: Date.parse(`1 ${account.since}`) || 0,
        vanity:
            account.anonymous || seed % 3 === 0
                ? null
                : account.nickname.toLowerCase().replace(/\W+/g, ''),
        friendCode: account.anonymous ? null : friendCodeOf(seed),
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
        lastBan:
            account.bans.length > 0 ? `${100 + (seed % 400)} days ago` : null,
        lock: account.locked ? { scope: 'credentials', recovery: true } : null,
        revocationCode: account.guard ? `R${10000 + (seed % 90000)}` : null,
        services: [
            steam(
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
        ],
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
                services: base.services.slice(0, 1),
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
                lastBan: '222 days ago',
            }),
        },
        'No Steam Guard': { account: { guard: false } },
        'Private profile': {
            details: (base) => ({ ...base, visibility: 'private' }),
        },
    },
)
