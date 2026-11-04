/** A picture's colours: the mean of each cell, RGB, upscaled smoothly it reads as the picture blurred. */
export const GRID_COLS = 8
export const GRID_ROWS = 5
const CELLS = GRID_COLS * GRID_ROWS

/** The grid of an RGBA image, its RGB bytes as base64 (160 chars). */
export function gridOf(
    rgba: ArrayLike<number>,
    width: number,
    height: number,
): string {
    const sums = new Array<number>(CELLS * 3).fill(0)
    const counts = new Array<number>(CELLS).fill(0)
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            const cell =
                Math.floor((y * GRID_ROWS) / height) * GRID_COLS +
                Math.floor((x * GRID_COLS) / width)
            counts[cell] = (counts[cell] ?? 0) + 1
            for (let c = 0; c < 3; c++)
                sums[cell * 3 + c] =
                    (sums[cell * 3 + c] ?? 0) +
                    (rgba[(y * width + x) * 4 + c] ?? 0)
        }
    return Uint8Array.from(sums, (sum, i) =>
        Math.round(sum / Math.max(1, counts[Math.floor(i / 3)] ?? 1)),
    ).toBase64()
}

/** The grid as RGBA pixels, GRID_COLS by GRID_ROWS; a damaged one reads as neutral grey. */
export function gridPixels(colors: string): Uint8ClampedArray<ArrayBuffer> {
    let rgb: Uint8Array | null = null
    try {
        rgb = Uint8Array.fromBase64(colors)
    } catch {}
    if (rgb?.length !== CELLS * 3) rgb = new Uint8Array(CELLS * 3).fill(96)
    const pixels = new Uint8ClampedArray(CELLS * 4)
    for (let cell = 0; cell < CELLS; cell++) {
        pixels.set(rgb.subarray(cell * 3, cell * 3 + 3), cell * 4)
        pixels[cell * 4 + 3] = 255
    }
    return pixels
}
