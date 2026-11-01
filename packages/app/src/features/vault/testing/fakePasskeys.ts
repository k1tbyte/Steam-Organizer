import { vi } from 'vitest'

import { installPasskeys } from '#core'

export type PrfAnswer = 'create' | 'get-only' | 'none'

/** A platform authenticator in node: `navigator.credentials` and `PublicKeyCredential` over a PRF of its own
 *  (SHA-256 of a per-credential secret and the salt, so the same salt always gives the same bits). */
export function fakeAuthenticator(
    options: { prf?: PrfAnswer; rpId?: string; capabilities?: boolean } = {},
) {
    const { prf = 'create', rpId = 'so.test', capabilities = true } = options
    const secrets = new Map<string, Uint8Array>()
    const calls = {
        create: [] as CredentialCreationOptions[],
        get: [] as CredentialRequestOptions[],
    }
    const state = { cancel: false }
    const outputs: ArrayBuffer[] = []
    const text = (bytes: BufferSource) =>
        new Uint8Array(
            bytes instanceof ArrayBuffer
                ? bytes
                : new Uint8Array(
                      bytes.buffer,
                      bytes.byteOffset,
                      bytes.byteLength,
                  ),
        )

    async function outputOf(id: string, salt: BufferSource) {
        const joined = new Uint8Array([
            ...(secrets.get(id) ?? []),
            ...text(salt),
        ])
        const output = (await crypto.subtle.digest(
            'SHA-256',
            joined,
        )) as ArrayBuffer
        outputs.push(output)
        return output
    }

    const Stub = {
        getClientCapabilities: capabilities
            ? async () => ({ 'extension:prf': prf !== 'none' })
            : undefined,
        isUserVerifyingPlatformAuthenticatorAvailable: async () => true,
    }

    const saltIn = (extensions: unknown) =>
        (extensions as { prf?: { eval?: { first: BufferSource } } } | undefined)
            ?.prf?.eval?.first

    const credential = (id: Uint8Array, extensions: object) => ({
        rawId: id.buffer.slice(0) as ArrayBuffer,
        getClientExtensionResults: () => extensions,
    })

    const credentials = {
        async create(request: CredentialCreationOptions) {
            calls.create.push(request)
            if (state.cancel)
                throw new DOMException('closed', 'NotAllowedError')
            const id = crypto.getRandomValues(new Uint8Array(16))
            const key = id.toBase64({ alphabet: 'base64url' })
            secrets.set(key, crypto.getRandomValues(new Uint8Array(32)))
            const salt = saltIn(request.publicKey?.extensions)
            return credential(id, {
                prf:
                    prf === 'none'
                        ? { enabled: false }
                        : prf === 'create' && salt
                          ? {
                                enabled: true,
                                results: { first: await outputOf(key, salt) },
                            }
                          : { enabled: true },
            })
        },
        async get(request: CredentialRequestOptions) {
            calls.get.push(request)
            if (state.cancel)
                throw new DOMException('closed', 'NotAllowedError')
            const allowed = request.publicKey?.allowCredentials?.[0]?.id
            const id = text(allowed as BufferSource)
            const key = id.toBase64({ alphabet: 'base64url' })
            if (!secrets.has(key))
                throw new DOMException('none', 'NotAllowedError')
            const salt = saltIn(request.publicKey?.extensions) as BufferSource
            return credential(id, {
                prf: { results: { first: await outputOf(key, salt) } },
            })
        },
    }

    vi.stubGlobal('PublicKeyCredential', Stub)
    Object.defineProperty(globalThis.navigator, 'credentials', {
        value: credentials,
        configurable: true,
    })
    installPasskeys({ rpId })

    return {
        calls,
        /** Every PRF buffer handed to the page, to see whether it was zeroed after use. */
        outputs,
        /** The user closes the next prompts. */
        cancel(on = true) {
            state.cancel = on
        },
        restore() {
            vi.unstubAllGlobals()
            Reflect.deleteProperty(globalThis.navigator, 'credentials')
            installPasskeys(undefined)
        },
    }
}
