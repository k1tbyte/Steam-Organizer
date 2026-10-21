import { describe, expect, it } from 'vitest'

import { detectSteamId } from './steamId'

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
