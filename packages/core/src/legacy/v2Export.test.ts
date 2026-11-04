import { describe, expect, it } from 'vitest'

import { WrongPasswordError } from '../errors'
import { isV2Sealed, openV2Export, readV2Export } from './v2Export'

const SALT = 'EOtzannXEOSd5HGBSJvs0op1BHRuvFwl'

/** The old app's `encrypt`: PBKDF2-SHA-1 over the password, AES-CBC, an IV marked at bytes 3 and 12. */
async function v2Encrypt(password: string, json: string) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            hash: 'SHA-1',
            salt: encoder.encode(SALT),
            iterations: 100_000,
        },
        await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey'],
        ),
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt'],
    )
    const iv = crypto.getRandomValues(new Uint8Array(16))
    iv[3] = 0x0a
    iv[12] = 0x0a
    const cipher = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            key,
            encoder.encode(json),
        ),
    )
    const bytes = new Uint8Array(16 + cipher.length)
    bytes.set(iv)
    bytes.set(cipher, 16)
    return bytes
}

// 76561199044795099 is past 2^53: as a JS number it reads 76561199044795100.
const ACCOUNTS = `[
  {
    "nickname": "nova_owl0",
    "login": "nova",
    "password": "hunter22",
    "phone": 79001234567,
    "id": 76561199044795099,
    "addedDate": "2023-04-01T10:00:00.000Z",
    "createdDate": "2015-06-02T00:00:00.000Z",
    "note": "a note with \\"id\\": 76561199044795099999 in it",
    "unpinIndex": 3,
    "visibilityState": 3,
    "credentials": [{ "i": 52, "f": { "0": "epic_nova", "2": "pass", "3": "" } }]
  },
  { "nickname": "anon", "login": "anon", "password": "pw", "id": 22202, "addedDate": "2024-01-01T00:00:00.000Z" }
]`

describe('old app export', () => {
    it('reads both shapes, a SteamID64 past 2^53 by its digits, a 32-bit account ID as its SteamID64', () => {
        const array = readV2Export(ACCOUNTS)
        const wrapped = readV2Export(
            `{ "timestamp": "2024-02-02T00:00:00.000Z", "data": ${ACCOUNTS} }`,
        )
        expect(wrapped).toEqual(array)
        const [nova, anon] = array ?? []
        expect(nova).toMatchObject({
            login: 'nova',
            steamId: '76561199044795099',
            phone: '79001234567',
            note: 'a note with "id": 76561199044795099999 in it',
            pinned: true,
            visibility: 3,
            addedAt: Date.parse('2023-04-01T10:00:00.000Z'),
            credentials: [
                {
                    icon: 52,
                    name: null,
                    fields: [
                        { kind: 'login', value: 'epic_nova' },
                        { kind: 'password', value: 'pass' },
                    ],
                },
            ],
        })
        expect(anon).toMatchObject({
            steamId: '76561197960287930',
            pinned: false,
            authenticator: null,
        })
    })

    it('reads nothing else as the old format', () => {
        expect(readV2Export('{"format":"steam-organizer-vault"}')).toBeNull()
        expect(readV2Export('[{"nickname":"no login"}]')).toBeNull()
        expect(readV2Export('not json')).toBeNull()
    })

    it('opens an encrypted export with its password, and tells a wrong one', async () => {
        const bytes = await v2Encrypt('old password', ACCOUNTS)
        expect(isV2Sealed(bytes)).toBe(true)
        const accounts = await openV2Export(bytes, 'old password')
        expect(accounts.map((account) => account.steamId)).toEqual([
            '76561199044795099',
            '76561197960287930',
        ])
        await expect(openV2Export(bytes, 'wrong')).rejects.toBeInstanceOf(
            WrongPasswordError,
        )
    })

    it('needs the version marks in the IV', async () => {
        const bytes = await v2Encrypt('old password', ACCOUNTS)
        bytes[12] = 0x0b
        expect(isV2Sealed(bytes)).toBe(false)
        expect(isV2Sealed(new TextEncoder().encode(ACCOUNTS))).toBe(false)
    })
})
