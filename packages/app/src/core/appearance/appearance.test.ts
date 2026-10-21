import { describe, expect, test, vi } from 'vitest'

import {
    type AppearanceRoot,
    applyPref,
    isPrefDefault,
    parsePref,
    resolveMode,
    resolveMotion,
} from './appearance'

function fakeRoot() {
    const attributes = new Map<string, string>()
    const properties = new Map<string, string>()
    const root: AppearanceRoot = {
        style: {
            setProperty: (name, value) =>
                void properties.set(name, value ?? ''),
            removeProperty: (name) => {
                const had = properties.get(name) ?? ''
                properties.delete(name)
                return had
            },
        },
        setAttribute: (name, value) => void attributes.set(name, value),
        removeAttribute: (name) => void attributes.delete(name),
    }
    return { root, attributes, properties }
}

describe('parsePref', () => {
    test('keeps a listed value and falls back on anything else', () => {
        expect(parsePref('surface', 'glass')).toBe('glass')
        expect(parsePref('surface', 'solid')).toBe('flat')
        expect(parsePref('background', null)).toBe('plain')
        expect(parsePref('mode', 'system')).toBe('system')
    })

    test('clamps a numeric range and rejects text', () => {
        expect(parsePref('radius', '30')).toBe('24')
        expect(parsePref('radius', '-4')).toBe('0')
        expect(parsePref('radius', '8')).toBe('8')
        expect(parsePref('radius', 'wide')).toBe('16')
        expect(parsePref('radius', '')).toBe('16')
    })

    test('free text passes through, empty takes the default', () => {
        expect(parsePref('accent', '#22d3ee')).toBe('#22d3ee')
        expect(parsePref('accent', '')).toBe('#7c86f8')
    })
})

describe('applyPref', () => {
    test('a default value removes its target', () => {
        const { root, attributes } = fakeRoot()
        applyPref(root, 'surface', 'glass')
        expect(attributes.get('data-surface')).toBe('glass')
        applyPref(root, 'surface', 'flat')
        expect(attributes.has('data-surface')).toBe(false)
    })

    test('a custom property takes its unit and drops at the default', () => {
        const { root, properties } = fakeRoot()
        applyPref(root, 'radius', '8')
        expect(properties.get('--radius-base')).toBe('8px')
        applyPref(root, 'radius', '16')
        expect(properties.has('--radius-base')).toBe(false)
    })

    test('mode and language stay written at their default', () => {
        const { root, attributes } = fakeRoot()
        applyPref(root, 'mode', 'dark')
        applyPref(root, 'language', 'en')
        expect(attributes.get('data-mode')).toBe('dark')
        expect(attributes.get('lang')).toBe('en')
        expect(isPrefDefault('mode', 'dark')).toBe(false)
    })

    test('system mode writes the resolved mode, never `system`', () => {
        const { root, attributes } = fakeRoot()
        applyPref(root, 'mode', 'system')
        expect(attributes.get('data-mode')).toBe(resolveMode('system'))
        expect(attributes.get('data-mode')).not.toBe('system')
    })

    test('auto motion writes a resolved level; an explicit one wins over the device', () => {
        const { root, attributes } = fakeRoot()
        applyPref(root, 'motion', 'auto')
        expect(['gamify', 'simple']).toContain(attributes.get('data-motion'))
        applyPref(root, 'motion', 'off')
        expect(attributes.get('data-motion')).toBe('off')
    })
})

describe('resolveMotion', () => {
    test('auto is Simple on a touch device or under OS reduced motion', () => {
        const query = (matched: string) => (q: string) => ({
            matches: q === matched,
        })
        vi.stubGlobal('matchMedia', query('(pointer: coarse)'))
        expect(resolveMotion('auto')).toBe('simple')
        vi.stubGlobal('matchMedia', query('(prefers-reduced-motion: reduce)'))
        expect(resolveMotion('auto')).toBe('simple')
        vi.stubGlobal('matchMedia', query('none'))
        expect(resolveMotion('auto')).toBe('gamify')
        expect(resolveMotion('simple')).toBe('simple')
        vi.unstubAllGlobals()
    })
})
