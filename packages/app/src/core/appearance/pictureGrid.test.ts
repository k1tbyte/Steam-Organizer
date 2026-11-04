import { expect, it } from 'vitest'

import { GRID_COLS, GRID_ROWS, gridOf, gridPixels } from './pictureGrid'

// A 16x10 image: the left half red, the right half blue, one green pixel in the top-left cell.
function image() {
    const rgba = new Uint8ClampedArray(16 * 10 * 4)
    for (let y = 0; y < 10; y++)
        for (let x = 0; x < 16; x++)
            rgba.set(
                x < 8 ? [255, 0, 0, 255] : [0, 0, 255, 255],
                (y * 16 + x) * 4,
            )
    rgba.set([0, 255, 0, 255], 0)
    return rgba
}

it('averages each cell and round-trips through its text', () => {
    const colors = gridOf(image(), 16, 10)
    expect(colors).toHaveLength(160)
    const pixels = gridPixels(colors)
    expect(pixels).toHaveLength(GRID_COLS * GRID_ROWS * 4)
    // The top-left cell holds 2x2 pixels, one of them green.
    expect([...pixels.subarray(0, 4)]).toEqual([191, 64, 0, 255])
    expect([...pixels.subarray(4, 8)]).toEqual([255, 0, 0, 255])
    const right = (GRID_COLS - 1) * 4
    expect([...pixels.subarray(right, right + 4)]).toEqual([0, 0, 255, 255])
})

it('reads a damaged grid as opaque grey', () => {
    for (const odd of ['', 'not base64!', 'AAAA'])
        expect([...gridPixels(odd).subarray(0, 4)]).toEqual([96, 96, 96, 255])
})
