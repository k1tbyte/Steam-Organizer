import type { VaultSlots } from '../crypto/keys'
import { SEAL_OVERHEAD } from '../crypto/seal'
import { UnsupportedVaultError } from '../errors'
import { VAULT_FORMAT, type VaultFile } from './vault'

// No text file starts so: tells the container from JSON (a v1 file, the old app's export).
const MAGIC = new TextEncoder().encode('SOVAULT\0')
const HEAD = MAGIC.length + 4

type Raw = Partial<Record<keyof VaultFile, unknown>>

/** The file as it leaves the device (Drive, an export): the magic, the header's length (u32 LE), the header JSON, then
 *  the sealed body as is. */
export function serializeVaultFile(file: VaultFile): Uint8Array<ArrayBuffer> {
    const { body, ...header } = file
    const json = new TextEncoder().encode(JSON.stringify(header))
    const out = new Uint8Array(HEAD + json.length + body.length)
    out.set(MAGIC)
    new DataView(out.buffer).setUint32(MAGIC.length, json.length, true)
    out.set(json, HEAD)
    out.set(body, HEAD + json.length)
    return out
}

/** A vault file from outside (a backup, an import), this format or v1's JSON; a newer format or a damaged file refuses. */
export function parseVaultFile(bytes: Uint8Array<ArrayBuffer>): VaultFile {
    const text = new TextDecoder()
    if (!MAGIC.every((byte, i) => bytes[i] === byte))
        return fromV1(parse(text.decode(bytes)))
    const length =
        bytes.length < HEAD
            ? Number.POSITIVE_INFINITY
            : new DataView(bytes.buffer, bytes.byteOffset).getUint32(
                  MAGIC.length,
                  true,
              )
    if (HEAD + length > bytes.length) throw new UnsupportedVaultError()
    const header = parse(text.decode(bytes.subarray(HEAD, HEAD + length)))
    if (header.version !== 2) throw new UnsupportedVaultError()
    return vaultFile(header, bytes.slice(HEAD + length))
}

/** A v1 file (JSON, its body base64: a file from before, an IndexedDB entry) as this version holds it, the same seal. */
export function fromV1(raw: Raw): VaultFile {
    if (raw.version !== 1 || typeof raw.body !== 'string')
        throw new UnsupportedVaultError()
    let body: Uint8Array<ArrayBuffer>
    try {
        body = Uint8Array.fromBase64(raw.body)
    } catch {
        throw new UnsupportedVaultError()
    }
    return vaultFile(raw, body)
}

function parse(text: string): Raw {
    let value: unknown
    try {
        value = JSON.parse(text)
    } catch {
        throw new UnsupportedVaultError()
    }
    if (typeof value !== 'object' || value === null)
        throw new UnsupportedVaultError()
    return value
}

// `partial` other than true reads as a whole vault; a body cut short of a seal refuses here, not at opening.
function vaultFile(raw: Raw, body: Uint8Array<ArrayBuffer>): VaultFile {
    const slots = raw.slots as VaultSlots | undefined
    if (
        raw.format !== VAULT_FORMAT ||
        typeof raw.id !== 'string' ||
        typeof slots?.password !== 'object' ||
        body.length < SEAL_OVERHEAD
    )
        throw new UnsupportedVaultError()
    const file: VaultFile = {
        format: VAULT_FORMAT,
        version: 2,
        id: raw.id,
        slots,
        body,
    }
    return raw.partial === true ? { ...file, partial: true } : file
}
