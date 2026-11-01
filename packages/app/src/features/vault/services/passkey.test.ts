import { afterEach, expect, it } from 'vitest'

import { fakeAuthenticator } from '../testing/fakePasskeys'
import { enroll, helloKindOf, passkeysAvailable, prfBits } from './passkey'

let authenticator: ReturnType<typeof fakeAuthenticator>

afterEach(() => authenticator?.restore())

it('is available when the browser reports the PRF extension, or without a report a user-verifying authenticator', async () => {
    authenticator = fakeAuthenticator()
    expect(await passkeysAvailable()).toBe(true)
    authenticator.restore()

    authenticator = fakeAuthenticator({ prf: 'none' })
    expect(await passkeysAvailable()).toBe(false)
    authenticator.restore()

    authenticator = fakeAuthenticator({ capabilities: false })
    expect(await passkeysAvailable()).toBe(true)
})

it('is not available without an RP ID from the shell', async () => {
    authenticator = fakeAuthenticator()
    const { installPasskeys } = await import('#core')
    installPasskeys(undefined)
    expect(await passkeysAvailable()).toBe(false)
    expect(await enroll('vault')).toEqual({ ok: false, reason: 'unsupported' })
})

it('enrolls a platform passkey for the shell RP ID and returns its PRF bits', async () => {
    authenticator = fakeAuthenticator({ rpId: 'steam.example' })
    const made = await enroll('vault-a')
    expect(made.ok).toBe(true)
    if (!made.ok) return
    expect(made.value.bits).toHaveLength(32)

    const [request] = authenticator.calls.create
    const publicKey = request?.publicKey
    expect(publicKey?.rp.id).toBe('steam.example')
    expect(publicKey?.authenticatorSelection).toMatchObject({
        authenticatorAttachment: 'platform',
        userVerification: 'required',
    })
    expect(authenticator.calls.get).toHaveLength(0)
})

it('zeroes the browser-owned PRF buffer once the bits are copied', async () => {
    authenticator = fakeAuthenticator()
    const made = await enroll('vault-a')
    if (!made.ok) throw new Error('enroll failed')
    expect(made.value.bits.some((byte) => byte !== 0)).toBe(true)
    for (const output of authenticator.outputs)
        expect(new Uint8Array(output).every((byte) => byte === 0)).toBe(true)
})

it('asks for the PRF with an assertion when the creation gives none', async () => {
    authenticator = fakeAuthenticator({ prf: 'get-only' })
    const made = await enroll('vault-a')
    expect(made.ok).toBe(true)
    expect(authenticator.calls.get).toHaveLength(1)
    const asked = authenticator.calls.get[0]?.publicKey
    expect(asked?.rpId).toBe('so.test')
    expect(asked?.userVerification).toBe('required')
})

it('gives the same bits for the same vault and other bits for another', async () => {
    authenticator = fakeAuthenticator()
    const made = await enroll('vault-a')
    if (!made.ok) throw new Error('enroll failed')
    const again = await prfBits(made.value.credentialId, 'vault-a')
    const other = await prfBits(made.value.credentialId, 'vault-b')
    expect(again).toEqual({ ok: true, value: made.value.bits })
    expect(other.ok && other.value).not.toEqual(made.value.bits)
    // An assertion names only the enrolled credential.
    const allowed = authenticator.calls.get.at(-1)?.publicKey?.allowCredentials
    expect(allowed).toHaveLength(1)
})

it('maps a cancelled, unsupported or failed ceremony to a result, never a thrown DOMException', async () => {
    authenticator = fakeAuthenticator()
    authenticator.cancel()
    expect(await enroll('v')).toEqual({ ok: false, reason: 'cancelled' })
    expect(await prfBits('AAAA', 'v')).toEqual({
        ok: false,
        reason: 'cancelled',
    })
    authenticator.restore()

    authenticator = fakeAuthenticator({ prf: 'none' })
    expect(await enroll('v')).toEqual({ ok: false, reason: 'unsupported' })
    authenticator.restore()

    authenticator = fakeAuthenticator()
    Object.defineProperty(globalThis.navigator.credentials, 'create', {
        value: async () => {
            throw new DOMException('bad', 'SecurityError')
        },
    })
    expect(await enroll('v')).toEqual({ ok: false, reason: 'failed' })
})

it('names the authenticator after the OS', () => {
    expect(helloKindOf('Win32', 'Mozilla/5.0 (Windows NT 10.0)')).toBe(
        'windows',
    )
    expect(helloKindOf('MacIntel', 'Mozilla/5.0 (Macintosh)')).toBe('touchid')
    expect(helloKindOf('iPhone', 'Mozilla/5.0 (iPhone)')).toBe('touchid')
    expect(helloKindOf('Linux armv8l', 'Mozilla/5.0 (Linux; Android 15)')).toBe(
        'fingerprint',
    )
    expect(helloKindOf('Linux x86_64', 'Mozilla/5.0 (X11; Linux x86_64)')).toBe(
        'passkey',
    )
})
