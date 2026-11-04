import { RECORD } from '@so/core'
import { expect, it } from 'vitest'

import { parseLook } from '#core/appearance/look'
import { findPreset, ownPresets, presetData, presetName } from './presets'

const look = parseLook({ mode: 'light', radius: '8' })
const data = new Map<string, unknown>([
    ['p2', presetData('Warm', look, { id: 'i1', colors: 'AAAA' })],
    ['p1', { kind: RECORD.PRESET, name: 'Cold', look: { radius: 'huge' } }],
    ['s1', { kind: RECORD.SERVICE, name: 'GOG' }],
])

it('lists the vault presets by name, each look coerced', () => {
    const presets = ownPresets(data)
    expect(presets.map(({ id, name }) => [id, name])).toEqual([
        ['p1', 'Cold'],
        ['p2', 'Warm'],
    ])
    expect(presets[0]?.look.radius).toBe('16')
    expect(presets[0]?.image).toBeNull()
    expect(presets[1]?.look).toEqual(look)
    expect(presets[1]?.image).toEqual({ id: 'i1', colors: 'AAAA' })
})

it('keeps only the picture id and colours in the record', () => {
    const image = { id: 'i1', colors: 'AAAA', own: true }
    expect(presetData('Warm', look, image).image).toEqual({
        id: 'i1',
        colors: 'AAAA',
    })
    expect(presetData('Warm', look, null)).not.toHaveProperty('image')
})

it('finds a name ignoring case and spacing', () => {
    const presets = ownPresets(data)
    expect(findPreset(presets, '  warm ')?.id).toBe('p2')
    expect(findPreset(presets, 'Night')).toBeUndefined()
    expect(presetName(' Night   glass ')).toBe('Night glass')
})
