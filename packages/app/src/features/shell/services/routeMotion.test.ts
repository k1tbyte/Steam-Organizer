import { describe, expect, it } from 'vitest'

import { pickRouteMotion } from './routeMotion'

const order = ['accounts', 'backups', 'bots', 'settings']
const accounts = { path: '/', nav: 'accounts' }
const backups = { path: '/backups', nav: 'backups' }
const settings = { path: '/settings', nav: 'settings' }
const security = { path: '/settings/security', nav: 'settings' }

describe('pickRouteMotion', () => {
    it('slides along the rail on Gamify desktop, in nav order', () => {
        const ctx = {
            order,
            desktop: true,
            level: 'gamify',
            morph: true,
        } as const
        expect(pickRouteMotion(backups, accounts, ctx)).toEqual({
            kind: 'slide-y',
            dir: 1,
        })
        expect(pickRouteMotion(accounts, backups, ctx)).toEqual({
            kind: 'slide-y',
            dir: -1,
        })
    })

    it('shifts on Simple, along the tab bar on phones', () => {
        const ctx = {
            order,
            desktop: false,
            level: 'simple',
            morph: true,
        } as const
        expect(pickRouteMotion(settings, backups, ctx)).toEqual({
            kind: 'shift-x',
            dir: 1,
        })
    })

    it('drills inside one section on Gamify, by depth', () => {
        const ctx = {
            order,
            desktop: false,
            level: 'gamify',
            morph: true,
        } as const
        expect(pickRouteMotion(security, settings, ctx)).toEqual({
            kind: 'drill',
            dir: 1,
        })
        expect(pickRouteMotion(settings, security, ctx)).toEqual({
            kind: 'drill',
            dir: -1,
        })
    })

    it('morphs a hero page on desktop, drills it on phones, swaps it without the browser support', () => {
        const profile = { path: '/accounts/a1', nav: 'accounts', hero: true }
        const desktop = {
            order,
            desktop: true,
            level: 'gamify',
            morph: true,
        } as const
        expect(pickRouteMotion(profile, accounts, desktop)).toEqual({
            kind: 'hero',
            dir: 1,
        })
        expect(pickRouteMotion(accounts, profile, desktop)).toEqual({
            kind: 'hero',
            dir: -1,
        })
        expect(
            pickRouteMotion(profile, accounts, { ...desktop, desktop: false }),
        ).toEqual({ kind: 'drill', dir: 1 })
        expect(
            pickRouteMotion(profile, accounts, { ...desktop, morph: false }),
        ).toBeNull()
    })

    it('shifts a deeper page sideways on Simple, the hero page too', () => {
        const profile = { path: '/accounts/a1', nav: 'accounts', hero: true }
        const ctx = {
            order,
            desktop: true,
            level: 'simple',
            morph: true,
        } as const
        expect(pickRouteMotion(profile, accounts, ctx)).toEqual({
            kind: 'shift-x',
            dir: 1,
        })
        expect(pickRouteMotion(settings, security, ctx)).toEqual({
            kind: 'shift-x',
            dir: -1,
        })
    })

    it('stays still for siblings at one depth', () => {
        const ctx = {
            order,
            desktop: true,
            level: 'gamify',
            morph: true,
        } as const
        expect(
            pickRouteMotion(
                { path: '/settings/sync', nav: 'settings' },
                security,
                ctx,
            ),
        ).toBeNull()
    })
})
