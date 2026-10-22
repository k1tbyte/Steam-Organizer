import { describe, expect, it } from 'vitest'

import { floatStyle, placeFloat, placeInField } from './placement'

const viewport = { width: 1000, height: 700 }
const size = { width: 340, height: 300 }
const field = { top: 200, left: 100, width: 320, height: 44 }

describe('placeFloat', () => {
    it('opens below the anchor, right-aligned with it', () => {
        expect(
            placeFloat(field, size, viewport, {
                align: 'end',
                prefer: 'below',
            }),
        ).toEqual({ left: 80, top: 250, bottom: null })
    })

    it('flips above when the space below is too short', () => {
        const low = { ...field, top: 500 }
        expect(
            placeFloat(low, size, viewport, { align: 'end', prefer: 'below' }),
        ).toEqual({ left: 80, top: null, bottom: 206 })
    })

    it('stays below when neither side fits', () => {
        const tight = { width: 1000, height: 400 }
        const placed = placeFloat(field, size, tight, {
            align: 'end',
            prefer: 'below',
        })
        expect(placed.top).toBe(250)
    })

    it('prefers above for a prompt that sits over its field', () => {
        const low = { ...field, top: 400 }
        expect(
            placeFloat(low, size, viewport, {
                align: 'center',
                prefer: 'above',
            }),
        ).toEqual({ left: 90, top: null, bottom: 306 })
    })

    it('keeps its own gap from the anchor, on either side', () => {
        const options = { align: 'center', prefer: 'above', gap: 38 } as const
        expect(
            placeFloat({ ...field, top: 400 }, size, viewport, options).bottom,
        ).toBe(338)
        expect(
            placeFloat({ ...field, top: 300 }, size, viewport, options).top,
        ).toBe(382)
    })

    it('falls back below when a preferred-above float has no room above', () => {
        const high = { ...field, top: 20 }
        expect(
            placeFloat(high, size, viewport, {
                align: 'center',
                prefer: 'above',
            }).top,
        ).toBe(70)
    })

    it('keeps the float inside the viewport horizontally', () => {
        const left = { ...field, left: 0, width: 100 }
        const right = { ...field, left: 900, width: 100 }
        expect(
            placeFloat(left, size, viewport, { align: 'end', prefer: 'below' })
                .left,
        ).toBe(8)
        expect(
            placeFloat(right, size, viewport, {
                align: 'center',
                prefer: 'below',
            }).left,
        ).toBe(652)
    })
})

describe('placeInField', () => {
    it('centers a square control against the field edge', () => {
        expect(placeInField(field, 30, 7)).toEqual({ top: 207, left: 383 })
    })
})

describe('floatStyle', () => {
    it('pins only the edge the float grows from', () => {
        expect(floatStyle({ left: 8, top: 50, bottom: null })).toEqual({
            left: '8px',
            top: '50px',
            bottom: undefined,
        })
        expect(floatStyle({ left: 8, top: null, bottom: 20 })).toEqual({
            left: '8px',
            top: undefined,
            bottom: '20px',
        })
    })
})
