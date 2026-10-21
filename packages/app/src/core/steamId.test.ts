import { describe, expect, it } from 'vitest'

import {
    detectSteamId,
    STEAM_ID_DISPLAY_FORMATS,
    steamIdValues,
    toSteamId64,
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

describe('steamIdValues', () => {
    const lookups = { friendCode: 'AKGU4-XF2P', vanity: 'kyzzdef' }

    it('converts one account ID into every format', () => {
        expect(steamIdValues('1084529371', lookups)).toEqual({
            'account-id': '1084529371',
            steamid64: '76561199044795099',
            steam2: 'STEAM_1:1:542264685',
            steam3: '[U:1:1084529371]',
            'friend-code': 'AKGU4-XF2P',
            'steam3-hex': '110000140a49adb',
            vanity: 'kyzzdef',
        })
    })

    it('handles an even account ID and a short one', () => {
        const values = steamIdValues('1402219980', lookups)
        expect(values.steam2).toBe('STEAM_1:0:701109990')
        expect(steamIdValues('1203', lookups)['steam3-hex']).toBe(
            '1100001000004b3',
        )
    })

    it('leaves what only Steam knows empty', () => {
        const values = steamIdValues('1203', { friendCode: null, vanity: null })
        expect(values['friend-code']).toBeNull()
        expect(values.vanity).toBeNull()
    })

    it('writes each format so that it detects as itself', () => {
        const values = steamIdValues('1084529371', lookups)
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
