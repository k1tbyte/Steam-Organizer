import { describe, expect, it } from 'vitest'

import { pickRouteMotion } from './routeMotion'

const order = ['accounts', 'backups', 'bots', 'settings']
const accounts = { path: '/', nav: 'accounts' }
const backups = { path: '/backups', nav: 'backups' }
const settings = { path: '/settings', nav: 'settings' }
const security = { path: '/settings/security', nav: 'settings' }

describe('pickRouteMotion', () => {
    it('slides along the rail on Flat desktop, in nav order', () => {
        const ctx = { order, desktop: true, flat: true }
        expect(pickRouteMotion(backups, accounts, ctx)).toEqual({
            kind: 'slide-y',
            dir: 1,
        })
        expect(pickRouteMotion(accounts, backups, ctx)).toEqual({
            kind: 'slide-y',
            dir: -1,
        })
    })

    it('shifts on Subtle and Glass, along the tab bar on phones', () => {
        const ctx = { order, desktop: false, flat: false }
        expect(pickRouteMotion(settings, backups, ctx)).toEqual({
            kind: 'shift-x',
            dir: 1,
        })
    })

    it('drills inside one section, by depth', () => {
        const ctx = { order, desktop: false, flat: false }
        expect(pickRouteMotion(security, settings, ctx)).toEqual({
            kind: 'drill',
            dir: 1,
        })
        expect(pickRouteMotion(settings, security, ctx)).toEqual({
            kind: 'drill',
            dir: -1,
        })
    })

    it('stays still for siblings at one depth', () => {
        const ctx = { order, desktop: true, flat: true }
        expect(
            pickRouteMotion(
                { path: '/settings/sync', nav: 'settings' },
                security,
                ctx,
            ),
        ).toBeNull()
    })
})
