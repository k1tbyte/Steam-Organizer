import { describe, expect, it } from 'vitest'

import { fitsLogin, readMaFile } from './maFile'

const SDA = `{"shared_secret":"cnOgv/KdpLoP6Nbh0GMkXkPXALQ=","revocation_code":"R48213","account_name":"nightjar_cs","identity_secret":"id=","Session":{"SteamID":76561198012345679}}`

describe('readMaFile', () => {
    it('reads the secrets, the login and the exact SteamID64', () => {
        const file = readMaFile(SDA)
        expect(file).toMatchObject({
            accountName: 'nightjar_cs',
            steamId: '76561198012345679',
            authenticator: {
                sharedSecret: 'cnOgv/KdpLoP6Nbh0GMkXkPXALQ=',
                revocationCode: 'R48213',
                identitySecret: 'id=',
            },
        })
    })

    it('takes the SteamID from the session only, whole', () => {
        const nested = `{"shared_secret":"s","extra":{"SteamID":76561198012345678},"Session":{"SteamID":76561198012345679}}`
        expect(readMaFile(nested)?.steamId).toBe('76561198012345679')
        expect(
            readMaFile(
                `{"shared_secret":"s","Session":{"SteamID":"765611980123456790"}}`,
            )?.steamId,
        ).toBeNull()
        expect(
            readMaFile(
                `{"shared_secret":"s","Session":{"SteamID":"76561198012345679"}}`,
            )?.steamId,
        ).toBe('76561198012345679')
        expect(
            readMaFile(
                `{"shared_secret":"s","Session":{"SteamID":765611980123456790}}`,
            )?.steamId,
        ).toBeNull()
        expect(readMaFile(`{"shared_secret":"s"}`)?.steamId).toBeNull()
    })

    it('refuses an encrypted file and one with no shared_secret', () => {
        expect(readMaFile('q83vEjRWeJA=')).toBeNull()
        expect(readMaFile('{"account_name":"a"}')).toBeNull()
        expect(readMaFile('null')).toBeNull()
    })
})

it('matches the login ignoring case, and passes when either is empty', () => {
    const file = readMaFile(SDA)
    if (!file) throw new Error('no file')
    expect(fitsLogin(file, ' Nightjar_CS ')).toBe(true)
    expect(fitsLogin(file, 'fire_fox_77')).toBe(false)
    expect(fitsLogin(file, '')).toBe(true)
})
