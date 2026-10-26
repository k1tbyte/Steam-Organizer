import { RECORD } from '@so/core'
import { expect, it } from 'vitest'

import { findService, ownServices, serviceName } from './vaultServices'

const data = new Map<string, unknown>([
    ['s2', { kind: RECORD.SERVICE, name: 'Wargaming', icon: '<svg/>' }],
    ['s1', { kind: RECORD.SERVICE, name: 'GOG' }],
    ['t1', { kind: RECORD.TAG, label: 'main', hue: 1 }],
])

it('lists the added services by name, with their icons', () => {
    expect(
        ownServices(data).map(({ id, name, svg }) => [id, name, svg]),
    ).toEqual([
        ['s1', 'GOG', null],
        ['s2', 'Wargaming', '<svg/>'],
    ])
})

it('finds a name ignoring case and spacing, built-in ones too', () => {
    const own = ownServices(data)
    expect(findService(own, '  gog ')?.id).toBe('s1')
    expect(findService(own, 'DISCORD')?.id).toBe('discord')
    expect(findService(own, 'Steam')).toBeUndefined()
    expect(serviceName(' Epic   Games ')).toBe('Epic Games')
})
