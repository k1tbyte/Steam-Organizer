export const PIN_LENGTH = 6
export const MAX_PIN_TRIES = 3

export function pinTriesLeft(wrongTries: number): number {
    return Math.max(0, MAX_PIN_TRIES - wrongTries)
}

/** Three wrong PINs leave only the master password. */
export function isPinLocked(wrongTries: number): boolean {
    return wrongTries >= MAX_PIN_TRIES
}
