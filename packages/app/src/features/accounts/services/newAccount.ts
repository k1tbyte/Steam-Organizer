import { detectSteamId } from './steamId'

export const MIN_PASSWORD_LENGTH = 6

export interface NewAccountInput {
    login: string
    password: string
    steamId: string
}

export interface ExistingAccounts {
    logins: string[]
    steamIds: string[]
}

export interface NewAccountErrors {
    login: 'taken' | null
    password: 'short' | null
    steamId: 'unrecognized' | 'taken' | null
}

/** Field errors only show once the field has something in it; `canAdd` also needs the required ones filled. */
export function validateNewAccount(
    { login, password, steamId }: NewAccountInput,
    existing: ExistingAccounts,
): { errors: NewAccountErrors; canAdd: boolean } {
    const name = login.trim().toLowerCase()
    const id = steamId.trim()
    const errors: NewAccountErrors = {
        login: name !== '' && existing.logins.includes(name) ? 'taken' : null,
        password:
            password !== '' && password.length < MIN_PASSWORD_LENGTH
                ? 'short'
                : null,
        // The mockup compares the typed text with stored IDs as is, not across formats.
        steamId:
            detectSteamId(id) === 'unknown'
                ? 'unrecognized'
                : id !== '' && existing.steamIds.includes(id)
                  ? 'taken'
                  : null,
    }
    const canAdd =
        name !== '' &&
        password.length >= MIN_PASSWORD_LENGTH &&
        Object.values(errors).every((error) => error === null)
    return { errors, canAdd }
}
