import type { CardFlags } from '../model'

/** Mirrors `--density-unit` per `data-density` in the kit's theme.css. */
export const DENSITY_UNITS = {
    compact: 3,
    comfortable: 4,
    spacious: 5,
} as const
export type Density = keyof typeof DENSITY_UNITS

export const CARD_MIN_WIDTH_PX = 340

// The header row with the card's two borders; units are density units.
const HEADER_PX = 56
const HEADER_UNITS = 7

export function hasFooter({ guard, note, actions }: CardFlags): boolean {
    return guard || note || actions
}

/** Tag chip and footer control heights; a touch card grows both. */
export function cardRows(touch: boolean) {
    return { tags: touch ? 28 : 22, footer: touch ? 36 : 28 }
}

/** Card height is `px + units * density unit`. It depends only on the flags and the platform, never on the account, so every row of a virtual list is the same height. */
export function cardMetrics(flags: CardFlags, touch: boolean) {
    const rows = cardRows(touch)
    let px = HEADER_PX
    let units = HEADER_UNITS
    if (flags.tags) {
        px += 4 + rows.tags
        units += 3
    }
    if (hasFooter(flags)) {
        px += 5 + rows.footer
        units += 6
    }
    return { px, units }
}

export function cardHeightPx(
    flags: CardFlags,
    touch: boolean,
    unit: number,
): number {
    const { px, units } = cardMetrics(flags, touch)
    return px + units * unit
}

export function cardHeightCss(flags: CardFlags, touch: boolean): string {
    const { px, units } = cardMetrics(flags, touch)
    return `calc(${px}px + var(--density-unit) * ${units})`
}
