import { detectSteamId, parseAccountId } from '../../../core/steamId'

export const MIN_PASSWORD_LENGTH = 6

export interface NewAccountInput {
    login: string
    password: string
    steamId: string
    alias: string
}

export interface ExistingAccounts {
    logins: string[]
    /** Account IDs. */
    steamIds: string[]
}

export interface NewAccountErrors {
    login: 'taken' | null
    password: 'short' | null
    steamId: 'unrecognized' | 'taken' | null
}

/** Field errors only show once the field has something in it; `canAdd` also needs the required ones filled.
 *  `needsName`: no alias and no Steam ID the text gives (a vanity name waits on the lookup); flagged only after a try. */
export function validateNewAccount(
    { login, password, steamId, alias }: NewAccountInput,
    existing: ExistingAccounts,
): { errors: NewAccountErrors; canAdd: boolean; needsName: boolean } {
    const name = login.trim().toLowerCase()
    const accountId = parseAccountId(steamId)
    const errors: NewAccountErrors = {
        login: name !== '' && existing.logins.includes(name) ? 'taken' : null,
        password:
            password !== '' && password.length < MIN_PASSWORD_LENGTH
                ? 'short'
                : null,
        steamId:
            detectSteamId(steamId) === 'unknown'
                ? 'unrecognized'
                : accountId !== null && existing.steamIds.includes(accountId)
                  ? 'taken'
                  : null,
    }
    const canAdd =
        name !== '' &&
        password.length >= MIN_PASSWORD_LENGTH &&
        Object.values(errors).every((error) => error === null)
    const needsName = alias.trim() === '' && accountId === null
    return { errors, canAdd, needsName }
}
