export const MIN_PASSWORD_LENGTH = 8

/** 0 is empty or too short; 4 needs length, mixed case, a digit and a symbol. */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4

export function passwordStrength(password: string): PasswordStrength {
    // Composition cannot rescue a password the dialog would refuse.
    if (password.length < MIN_PASSWORD_LENGTH)
        return password.length >= 6 ? 1 : 0
    let score = 1
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++
    return score as PasswordStrength
}
