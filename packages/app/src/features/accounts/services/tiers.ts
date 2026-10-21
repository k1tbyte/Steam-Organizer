/** The tens digit picks the level badge's look, wrapping every hundred levels. */
export function levelTier(level: number): number {
    return Math.floor(level / 10) % 10
}

const LEVEL_HUES = [0, 25, 55, 95, 145, 245, 290, 340, 20, 75] as const

export function levelHue(level: number): number {
    return LEVEL_HUES[levelTier(level)] ?? 0
}

export const AGE_TIER_YEARS = [0, 5, 10, 15] as const

/** 0 under 5 years (and anonymous accounts), then 5+, 10+, 15+. */
export function ageTier(years: number, anonymous: boolean): number {
    if (anonymous) return 0
    return AGE_TIER_YEARS.findLastIndex((from) => years >= from)
}

export function initialsOf(name: string): string {
    return name
        .replace(/[^A-Za-z0-9 ]/g, ' ')
        .trim()
        .split(/\s+/)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
}
