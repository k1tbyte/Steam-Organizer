/** The WebAuthn relying party the shell's pages may use, installed by `createEntry` from `Platform.passkeys`. */
export interface PasskeyConfig {
    rpId: string
}

let installed: PasskeyConfig | undefined

export function installPasskeys(config: PasskeyConfig | undefined) {
    installed = config
}

/** Undefined where the shell has no stable one (Firefox's per-profile extension host): Hello is unavailable there. */
export const passkeyRpId = () => installed?.rpId
