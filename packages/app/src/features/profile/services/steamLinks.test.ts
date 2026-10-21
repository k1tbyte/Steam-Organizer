import { describe, expect, it } from 'vitest'

import { STEAM_LINK_KEYS, steamLinkUrl } from './steamLinks'

describe('steamLinkUrl', () => {
    it('builds every page from the SteamID64', () => {
        expect(steamLinkUrl('profile', '1084529371')).toBe(
            'https://steamcommunity.com/profiles/76561199044795099',
        )
        expect(steamLinkUrl('games', '1084529371')).toBe(
            'https://steamcommunity.com/profiles/76561199044795099/games/?tab=all',
        )
        expect(steamLinkUrl('steamdb', '1084529371')).toBe(
            'https://steamdb.info/calculator/76561199044795099/',
        )
    })

    it('keeps each page on its own address', () => {
        const urls = STEAM_LINK_KEYS.map((key) => steamLinkUrl(key, '1203'))
        expect(new Set(urls).size).toBe(STEAM_LINK_KEYS.length)
    })
})
