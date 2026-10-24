export class WrongPasswordError extends Error {
    override name = 'WrongPasswordError'
}

/** A newer format or a damaged file: no password opens it. */
export class UnsupportedVaultError extends Error {
    override name = 'UnsupportedVaultError'
}
