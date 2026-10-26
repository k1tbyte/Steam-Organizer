import { type CredentialKind, MIN_PASSWORD_LENGTH } from '@so/core'

export type CredentialProblem = 'short' | 'phone' | 'email'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PHONE_DIGITS = 8

/** What keeps a typed field from saving; an empty one is simply left out. */
export function credentialProblem(
    kind: CredentialKind,
    value: string,
): CredentialProblem | null {
    if (value.trim() === '') return null
    if (kind === 'password' && value.length < MIN_PASSWORD_LENGTH)
        return 'short'
    if (kind === 'phone' && value.replace(/\D/g, '').length < MIN_PHONE_DIGITS)
        return 'phone'
    if (kind === 'email' && !EMAIL.test(value.trim())) return 'email'
    return null
}
