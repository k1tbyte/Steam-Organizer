export interface Size {
    width: number
    height: number
}

/** A rectangle in viewport pixels, as `getBoundingClientRect` reports it. */
export interface Box extends Size {
    top: number
    left: number
}

/** A float is pinned by `top` when it opens downward and by `bottom` when it opens upward, so it grows away from its anchor. */
export interface FloatPlacement {
    left: number
    top: number | null
    bottom: number | null
}

interface FloatOptions {
    align: 'end' | 'center'
    prefer: 'below' | 'above'
    /** Pixels between the anchor and the float. */
    gap?: number
}

const MARGIN = 8

/** Puts a float of at most `size` next to `anchor`, flipping to the other side when its own side is too short. */
export function placeFloat(
    anchor: Box,
    size: Size,
    viewport: Size,
    { align, prefer, gap = 6 }: FloatOptions,
): FloatPlacement {
    const needed = size.height + gap
    const fitsBelow = viewport.height - (anchor.top + anchor.height) >= needed
    const fitsAbove = anchor.top >= needed
    const below =
        prefer === 'below' ? fitsBelow || !fitsAbove : !fitsAbove && fitsBelow

    const wanted =
        align === 'end'
            ? anchor.left + anchor.width - size.width
            : anchor.left + anchor.width / 2 - size.width / 2
    const left = Math.max(
        MARGIN,
        Math.min(wanted, viewport.width - size.width - MARGIN),
    )

    return below
        ? { left, top: anchor.top + anchor.height + gap, bottom: null }
        : { left, top: null, bottom: viewport.height - anchor.top + gap }
}

/** The corner spot inside a field for a square control of `size`, vertically centered. */
export function placeInField(anchor: Box, size: number, inset: number) {
    return {
        top: anchor.top + (anchor.height - size) / 2,
        left: anchor.left + anchor.width - inset - size,
    }
}

/** The CSS a fixed-position float takes for its placement. */
export function floatStyle({ left, top, bottom }: FloatPlacement) {
    return {
        left: `${left}px`,
        top: top === null ? undefined : `${top}px`,
        bottom: bottom === null ? undefined : `${bottom}px`,
    }
}
