import { expect, it } from 'vitest'

import { isSteamLoginUrl, STEAM_LOGIN_MATCHES } from './steamPages'

it('matches the login pages the content script runs on, with a query and a fragment', () => {
    for (const url of [
        'https://store.steampowered.com/login',
        'https://store.steampowered.com/login/?redir=%2F',
        'https://store.steampowered.com/login#next',
        'https://steamcommunity.com/login/home/?goto=',
        'https://help.steampowered.com/en/wizard/Login?redir=%2Fwizard%2FHelpWithLogin',
    ])
        expect(isSteamLoginUrl(url), url).toBe(true)
})

it('refuses another page, host, scheme or an address that only looks like one', () => {
    for (const url of [
        undefined,
        '',
        'not a url',
        'https://store.steampowered.com/',
        'https://store.steampowered.com/app/10',
        'http://store.steampowered.com/login',
        'https://store.steampowered.com.evil.example/login',
        'https://store.steampowered.com@evil.example/login',
        'https://evil.example/login',
        'https://evil.example/?next=https://store.steampowered.com/login',
        'https://help.steampowered.com/en/other/Login',
    ])
        expect(isSteamLoginUrl(url), String(url)).toBe(false)
})

it('is the list the content script declares: nothing in it is a pattern the check cannot read', () => {
    expect(STEAM_LOGIN_MATCHES.length).toBeGreaterThan(0)
    for (const pattern of STEAM_LOGIN_MATCHES)
        expect(isSteamLoginUrl(pattern.replace(/\*/g, 'x'))).toBe(true)
})
