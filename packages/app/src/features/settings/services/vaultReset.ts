export const RESET_STEPS = 3

/** Step 1 reads the consequences, step 2 needs the vault name typed exactly, step 3 is the hold. */
export function canContinueReset(
    step: number,
    typedName: string,
    vaultName: string,
): boolean {
    if (step === 1) return true
    return step === 2 && typedName.trim() === vaultName
}
