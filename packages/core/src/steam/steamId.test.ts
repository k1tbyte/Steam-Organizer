import { describe, expect, it } from 'vitest'

import {
    detectSteamId,
    parseAccountId,
    STEAM_ID_DISPLAY_FORMATS,
    steamIdValues,
    toAccountId,
    toSteamId64,
    vanityIn,
} from './steamId'

describe('detectSteamId', () => {
    it.each([
        ['1084529371', 'account-id'],
        ['76561198012345678', 'steamid64'],
        ['STEAM_0:1:42356789', 'steam2'],
        ['[U:1:84713579]', 'steam3'],
        [
            'https://steamcommunity.com/profiles/76561198012345678',
            'profile-url',
        ],
        ['steamcommunity.com/id/nova-strike/', 'profile-url'],
        ['AB3DE-FGHJ', 'friend-code'],
        ['0x110000104b7f6d3', 'steam3-hex'],
        ['nova_strike', 'vanity'],
    ] as const)('reads %s as %s', (raw, format) => {
        expect(detectSteamId(raw)).toBe(format)
    })

    it('tells empty input from an unrecognized one', () => {
        expect(detectSteamId('   ')).toBeNull()
        expect(detectSteamId('not a profile!')).toBe('unknown')
        expect(detectSteamId('a')).toBe('unknown')
    })

    it('accepts a profile URL only on steamcommunity.com, whole', () => {
        expect(detectSteamId('https://notsteamcommunity.com/id/nova')).toBe(
            'unknown',
        )
        expect(
            detectSteamId(
                'see https://steamcommunity.com/profiles/76561198012345678 now!',
            ),
        ).toBe('unknown')
        expect(
            detectSteamId('https://www.steamcommunity.com/id/nova?l=english'),
        ).toBe('profile-url')
    })

    it('trims before matching', () => {
        expect(detectSteamId('  76561198012345678  ')).toBe('steamid64')
    })
})

describe('parseAccountId', () => {
    it.each([
        '1084529371',
        '76561199044795099',
        'STEAM_1:1:542264685',
        '[U:1:1084529371]',
        '0x110000140a49adb',
        'https://steamcommunity.com/profiles/76561199044795099/',
        'steamcommunity.com/PROFILES/76561199044795099',
    ])('reads the account ID from %s', (raw) => {
        expect(parseAccountId(raw)).toBe('1084529371')
    })

    it('reads a CS2 friend code, refusing one whose check bits fail', () => {
        expect(parseAccountId('SUCVS-FADA')).toBe('22202')
        expect(parseAccountId('a5qxe-bxtc')).toBe('1084529371')
        expect(parseAccountId('A5QXE-BXTD')).toBeNull()
        expect(parseAccountId('A5QXE-BXT0')).toBeNull()
    })

    it('needs Steam for a vanity name or a custom URL', () => {
        expect(parseAccountId('nova_strike')).toBeNull()
        expect(parseAccountId('steamcommunity.com/id/nova')).toBeNull()
        expect(toAccountId(toSteamId64('1084529371'))).toBe('1084529371')
    })
})

describe('vanityIn', () => {
    it.each([
        ['nova_strike', 'nova_strike'],
        ['john-wick', 'john-wick'],
        ['https://steamcommunity.com/id/nova-strike/', 'nova-strike'],
        ['https://steamcommunity.com/profiles/76561199044795099/', null],
        ['76561199044795099', null],
    ])('reads %s as %s', (raw, vanity) => {
        expect(vanityIn(raw)).toBe(vanity)
    })
})

describe('steamIdValues', () => {
    it('converts one account ID into every format', () => {
        expect(steamIdValues('1084529371', 'kyzzdef')).toEqual({
            'account-id': '1084529371',
            steamid64: '76561199044795099',
            steam2: 'STEAM_1:1:542264685',
            steam3: '[U:1:1084529371]',
            'friend-code': 'A5QXE-BXTC',
            'steam3-hex': '110000140a49adb',
            vanity: 'kyzzdef',
        })
    })

    it('handles an even account ID and a short one', () => {
        const values = steamIdValues('1402219980', null)
        expect(values.steam2).toBe('STEAM_1:0:701109990')
        expect(steamIdValues('1203', null)['steam3-hex']).toBe(
            '1100001000004b3',
        )
    })

    it('computes the friend code, and leaves an absent vanity name empty', () => {
        const values = steamIdValues('22202', null)
        expect(values['friend-code']).toBe('SUCVS-FADA')
        expect(values.vanity).toBeNull()
    })

    it('writes each format so that it detects as itself', () => {
        const values = steamIdValues('1084529371', 'kyzzdef')
        for (const format of STEAM_ID_DISPLAY_FORMATS) {
            const value = values[format] ?? ''
            expect(detectSteamId(value)).toBe(format)
        }
    })
})

describe('toSteamId64', () => {
    it('adds the individual base to the account ID', () => {
        expect(toSteamId64('1203')).toBe('76561197960266931')
    })
})
