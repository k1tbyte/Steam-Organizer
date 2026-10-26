import type { Authenticator } from '@so/core'

export interface MaFile {
    accountName: string
    /** SteamID64 from the file's session, when it has one. */
    steamId: string | null
    authenticator: Authenticator
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

function sessionSteamId(raw: string, session: unknown): string | null {
    const value =
        typeof session === 'object' && session !== null
            ? (session as Record<string, unknown>).SteamID
            : undefined
    if (typeof value === 'string') return /^\d{17}$/.test(value) ? value : null
    if (typeof value !== 'number') return null
    // A SteamID64 is past 2^53: JSON.parse rounds it, so the exact digits are the token in the text that rounds the same.
    for (const [, digits] of raw.matchAll(/"SteamID"\s*:\s*(\d+)/g))
        if (digits?.length === 17 && Number(digits) === value) return digits
    return null
}

/** An SDA maFile; null when it is not JSON or has no shared_secret (an encrypted SDA file is neither). */
export function readMaFile(raw: string): MaFile | null {
    let file: unknown
    try {
        file = JSON.parse(raw)
    } catch {
        return null
    }
    if (typeof file !== 'object' || file === null) return null
    const fields = file as Record<string, unknown>
    const sharedSecret = text(fields.shared_secret)
    if (!sharedSecret) return null
    return {
        accountName: text(fields.account_name),
        steamId: sessionSteamId(raw, fields.Session),
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
