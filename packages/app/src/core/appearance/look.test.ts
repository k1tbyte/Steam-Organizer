import { expect, it } from 'vitest'

import { type Look, parseLook, sameLook } from './look'

const night: Look = {
    mode: 'dark',
    accent: '#7c86f8',
    tint: 'on',
    surface: 'glass',
    background: 'image',
    radius: '16',
    density: 'comfortable',
    blur: '28',
    dim: '40',
}

it('reads a stored look, a missing or odd setting as its default', () => {
    expect(parseLook({ ...night })).toEqual(night)
    expect(
        parseLook({
            mode: 'neon',
            radius: '99',
            blur: '-5',
            dim: 'x',
            motion: 'off',
        }),
    ).toEqual({
        mode: 'dark',
        accent: '#7c86f8',
        tint: 'on',
        surface: 'flat',
        background: 'plain',
        radius: '24',
        density: 'comfortable',
        blur: '0',
        dim: '40',
    })
})

it('compares blur and dim only on an Image background', () => {
    expect(sameLook(night, { ...night })).toBe(true)
    expect(sameLook(night, { ...night, blur: '30' })).toBe(false)
    expect(sameLook(night, { ...night, accent: '#22d3ee' })).toBe(false)
    const plain: Look = { ...night, background: 'plain' }
    expect(sameLook(plain, { ...plain, blur: '30', dim: '0' })).toBe(true)
})
