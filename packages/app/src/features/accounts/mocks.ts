import { defineMock } from '#core'

import type { Account, AccountTag, BanKind, RefreshProgress } from './model'

/** What Copy password puts on the clipboard and a fill types: no vault is decrypted yet. */
export const DEMO_STEAM_PASSWORD = '********'

export interface AccountsSample {
    accounts: readonly Account[]
    /** Every tag of the vault, worn or not, by label. */
    tags: readonly AccountTag[]
    /** Seeds the search box when the sample is picked, so a sample can open on "no results". */
    query?: string
}

interface Raw {
    id: string
    name: string
    alias?: string
    tags?: string[]
    level?: number
    years?: number
    since?: string
    sid?: string
    bans?: BanKind[]
    pinned?: boolean
    guard?: boolean
    hue?: number
    note?: string
    anon?: boolean
}

// On the swatches (`TAG_HUES`), so the registry rings the picked one.
const TAG_HUE: Record<string, number> = {
    main: 265,
    trade: 150,
    cs2: 45,
    prime: 95,
    faceit: 25,
    farm: 205,
    cards: 330,
    smurf: 25,
    collection: 95,
    family: 205,
    // Worn by nobody: the registry's "Not used".
    alts: 330,
}
const TAGS: AccountTag[] = Object.entries(TAG_HUE)
    .map(([label, hue]) => ({ id: label, label, hue }))
    .sort((a, b) => a.label.localeCompare(b.label))

// The mockup's twelve, in its order.
const RAW: Raw[] = [
    {
        id: 'a1',
        tags: ['main', 'trade'],
        name: 'kyzzdef',
        level: 27,
        years: 5.4,
        since: 'Apr 2020',
        sid: '1084529371',
        pinned: true,
        guard: true,
        hue: 265,
        note: 'Main · trade-ready',
    },
    {
        id: 'a2',
        tags: ['cs2', 'prime', 'faceit', 'trade'],
        name: 'Halcyon_North',
        level: 52,
        years: 13,
        since: 'Jan 2013',
        sid: '38291044',
        pinned: true,
        guard: true,
        hue: 205,
        note: 'CS2 prime, faceit linked',
    },
    {
        id: 'a3',
        name: 'nightjar',
        alias: 'Main · Faceit',
        level: 8,
        years: 11,
        since: 'Mar 2015',
        sid: '205118372',
        bans: ['community'],
        hue: 18,
    },
    {
        id: 'a4',
        tags: ['family'],
        name: 'Mollik',
        level: 0,
        years: 9.2,
        since: 'Aug 2016',
        sid: '318840219',
        hue: 45,
        note: 'Family share',
    },
    {
        id: 'a5',
        tags: ['farm'],
        name: 'Penguinwatch',
        level: 13,
        years: 3.1,
        since: 'Oct 2022',
        sid: '1190023817',
        guard: true,
        hue: 235,
    },
    {
        id: 'a6',
        name: 'Borealis Fyne',
        level: 5,
        years: 6.1,
        since: 'Sep 2019',
        sid: '902114475',
        bans: ['game'],
        hue: 140,
        note: 'Game ban: Dota 2',
    },
    { id: 'a7', name: 'smurf_eu_04', anon: true, note: 'Credentials only' },
    {
        id: 'a8',
        tags: ['farm', 'cards'],
        name: 'Starwave',
        level: 34,
        years: 5.3,
        since: 'Jul 2020',
        sid: '1122309841',
        guard: true,
        hue: 305,
    },
    {
        id: 'a9',
        tags: ['smurf'],
        name: 'bunny hop',
        level: 4,
        years: 17.9,
        since: 'Dec 2007',
        sid: '8812094',
        bans: ['vac'],
        hue: 330,
        note: 'VAC 2019, CS:GO',
    },
    {
        id: 'a10',
        name: 'Crane Jabroni',
        level: 0,
        years: 1.4,
        since: 'May 2024',
        sid: '1612009388',
        hue: 95,
    },
    {
        id: 'a11',
        tags: ['collection'],
        name: 'carousel',
        level: 71,
        years: 22,
        since: 'Oct 2004',
        sid: '1203',
        guard: true,
        hue: 60,
        note: 'Old badge collection',
    },
    {
        id: 'a12',
        tags: ['trade'],
        name: 'Dorado',
        level: 16,
        years: 4.7,
        since: 'Feb 2022',
        sid: '1402219980',
        bans: ['community', 'economy'],
        hue: 170,
        note: 'Trade ban until Dec',
    },
]

const NOW = Date.UTC(2025, 8, 1)
const HOUR = 3_600_000

function toAccount(raw: Raw, index: number): Account {
    return {
        id: raw.id,
        nickname: raw.alias ?? raw.name,
        alias: raw.alias ?? null,
        steamNickname: raw.anon ? null : raw.name,
        login: raw.name.toLowerCase(),
        anonymous: raw.anon === true,
        steamId: raw.anon ? null : (raw.sid ?? null),
        level: raw.level ?? 0,
        years: raw.years ?? 0,
        since: raw.since ?? '',
        hue: raw.hue ?? 0,
        bans: raw.bans ?? [],
        tags: (raw.tags ?? []).flatMap((label) =>
            TAGS.filter((tag) => tag.label === label),
        ),
        pinned: raw.pinned === true,
        guard: raw.guard === true,
        note: raw.note ?? '',
        locked: false,
        // Newest first, so "last update" keeps the mockup's order.
        added: NOW - index * 72 * HOUR,
        updated: NOW - index * 5 * HOUR,
    }
}

const TWELVE = RAW.map(toAccount)

const ANONYMOUS = Array.from({ length: 6 }, (_, i) =>
    toAccount(
        {
            id: `anon${i}`,
            name: `smurf_eu_0${i + 1}`,
            alias: `EU smurf ${i + 1}`,
            anon: true,
            pinned: i === 0,
            note: i % 2 === 0 ? 'Credentials only' : '',
        },
        i,
    ),
)

const FIRST = ['frost', 'nova', 'kite', 'ember', 'pixel', 'moss', 'rune', 'vex']
const SECOND = ['wolf', 'strike', 'fox', 'jar', 'hop', 'wave', 'byte', 'owl']

/** Deterministic, so a reload shows the same thousands. */
function generate(count: number): Account[] {
    let seed = 7
    const next = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed / 2 ** 32
    }
    const pick = <T>(list: readonly T[]) =>
        list[Math.floor(next() * list.length)] as T
    return Array.from({ length: count }, (_, i) =>
        toAccount(
            {
                id: `g${i}`,
                name: `${pick(FIRST)}_${pick(SECOND)}${i}`,
                level: Math.floor(next() ** 2 * 120),
                years: Math.round(next() * 200) / 10,
                since: 'Jan 2012',
                sid: String(Math.floor(next() * 1.9e9)),
                bans:
                    next() < 0.08
                        ? [
                              pick([
                                  'vac',
                                  'game',
                                  'community',
                                  'economy',
                              ] as const),
                          ]
                        : [],
                tags:
                    next() < 0.4
                        ? [pick(['main', 'trade', 'farm', 'cs2'])]
                        : [],
                pinned: i < 5,
                guard: next() < 0.4,
                hue: Math.floor(next() * 360),
                note: next() < 0.5 ? 'Imported' : '',
            },
            i,
        ),
    )
}

export const accountsMock = defineMock<AccountsSample>(
    'accounts.list',
    'Accounts',
    {
        // Default while the virtual list is tuned; keeps the mockup's twelve and their ids.
        '2000 accounts': {
            accounts: [...TWELVE, ...generate(2000 - TWELVE.length)],
            tags: TAGS,
        },
        Twelve: { accounts: TWELVE, tags: TAGS },
        Empty: { accounts: [], tags: [] },
        'No results': { accounts: TWELVE, tags: TAGS, query: 'zzz' },
        'One locked': {
            accounts: TWELVE.map((a) =>
                a.id === 'a2' ? { ...a, locked: true } : a,
            ),
            tags: TAGS,
        },
        'Anonymous only': { accounts: ANONYMOUS, tags: TAGS },
    },
)

export const refreshMock = defineMock<RefreshProgress | null>(
    'accounts.refresh',
    'Refresh in flight',
    {
        'Eight left': { remaining: 8, progress: 0.62 },
        Idle: null,
    },
)
