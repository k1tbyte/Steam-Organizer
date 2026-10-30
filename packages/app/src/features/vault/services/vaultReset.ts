export const RESET_STEPS = 3

/** Step 1 reads the consequences, step 2 needs the vault name typed exactly (outer spaces aside), step 3 is the hold. */
export function canContinueReset(
    step: number,
    typedName: string,
    vaultName: string,
): boolean {
    const name = vaultName.trim()
    if (name === '') return false
    if (step === 1) return true
    return step === 2 && typedName.trim() === name
}
