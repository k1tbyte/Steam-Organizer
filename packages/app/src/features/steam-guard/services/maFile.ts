import type { Authenticator } from '@so/core'

export interface MaFile {
    accountName: string
    /** SteamID64 from the file's session, when it has one. */
    steamId: string | null
    authenticator: Authenticator
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

/** An SDA maFile; null when it is not JSON or has no shared_secret (an encrypted SDA file is neither). */
export function readMaFile(raw: string): MaFile | null {
    let file: unknown
    try {
        // A SteamID64 is past 2^53, so a number would round: every SteamID is read as its digits.
        file = JSON.parse(raw.replace(/("SteamID"\s*:\s*)(\d+)/g, '$1"$2"'))
    } catch {
        return null
    }
    if (typeof file !== 'object' || file === null) return null
    const fields = file as Record<string, unknown>
    const sharedSecret = text(fields.shared_secret)
    if (!sharedSecret) return null
    const session = fields.Session
    const steamId =
        typeof session === 'object' && session !== null
            ? text((session as Record<string, unknown>).SteamID)
            : ''
    return {
        accountName: text(fields.account_name),
        steamId: /^\d{17}$/.test(steamId) ? steamId : null,
        authenticator: {
            sharedSecret,
            identitySecret: text(fields.identity_secret),
            revocationCode: text(fields.revocation_code),
            maFile: fields,
        },
    }
}

/** Steam never renames a login, so a different account_name is a different account. An empty one says nothing. */
export const fitsLogin = (file: MaFile, login: string) =>
    !file.accountName ||
    !login ||
    file.accountName.toLowerCase() === login.trim().toLowerCase()
