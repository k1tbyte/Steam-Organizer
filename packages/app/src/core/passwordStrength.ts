export const MIN_MASTER_LENGTH = 8

export type StrengthLevel = 0 | 1 | 2 | 3 | 4

/** `FpSegmentedMeter` tones and source-English labels (for `t()`) per level. */
export const STRENGTH_TONES = [
    'neutral',
    'danger',
    'warning',
    'success',
    'success',
] as const satisfies Record<StrengthLevel, string>
export const STRENGTH_LABELS = [
    'At least 8 characters',
    'Weak',
    'Okay',
    'Strong',
    'Very strong',
] as const satisfies Record<StrengthLevel, string>

/** 0 means "too short to rate"; 1 to 4 are Weak, Okay, Strong, Very strong. */
export function passwordStrength(password: string): StrengthLevel {
    // Below the minimum nothing can raise it: the form refuses these anyway.
    if (password.length < MIN_MASTER_LENGTH) return password.length >= 6 ? 1 : 0
    let level = 1
    if (password.length >= 12) level++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) level++
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) level++
    return level as StrengthLevel
}
