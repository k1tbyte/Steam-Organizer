export type PasswordProblem = 'blank' | 'wrong'

/** What is wrong with the password typed for an older backup, if anything. */
export function passwordProblem(
    entered: string,
    expected: string,
): PasswordProblem | null {
    if (entered === '') return 'blank'
    return entered === expected ? null : 'wrong'
}
