import { createVault, serializeVaultFile, type VaultFile } from '@so/core'
import { beforeAll, expect, it } from 'vitest'

import { importFile } from './importFile'

let file: VaultFile
beforeAll(async () => {
    file = (await createVault('correct horse')).file
})

const utf8 = (text: string) => new TextEncoder().encode(text)
const v1 = (of: VaultFile) =>
    utf8(JSON.stringify({ ...of, version: 1, body: of.body.toBase64() }))

it("tells this vault's file, its partial file and another vault's, in this format and v1's", () => {
    const partial: VaultFile = { ...file, partial: true }
    for (const bytesOf of [serializeVaultFile, v1]) {
        expect(importFile(bytesOf(file), file.id)).toMatchObject({
            kind: 'replace',
            file: { id: file.id, version: 2, body: file.body },
        })
        expect(importFile(bytesOf(partial), file.id).kind).toBe('merge')
        expect(importFile(bytesOf(partial), 'other').kind).toBe('other-partial')
        expect(importFile(bytesOf(file), 'other').kind).toBe('other-vault')
    }
})

it("reads the old app's exports, plain and sealed, and refuses anything else", () => {
    const plain = utf8('[{"nickname":"nova","login":"nova","password":"pw"}]')
    expect(importFile(plain, file.id)).toMatchObject({
        kind: 'v2',
        accounts: [{ login: 'nova' }],
    })
    const sealed = new Uint8Array(32)
    sealed[3] = 0x0a
    sealed[12] = 0x0a
    expect(importFile(sealed, file.id).kind).toBe('v2-sealed')
    const cut = serializeVaultFile(file).slice(0, 20)
    expect(importFile(cut, file.id).kind).toBe('unreadable')
    expect(importFile(utf8('{"format":"other"}'), file.id).kind).toBe(
        'unreadable',
    )
})
