import { CREDENTIAL_KINDS, type CredentialKind } from '../account/records'
import { checked } from '../crypto/kdf'
import { WrongPasswordError } from '../errors'
import { toAccountId, toSteamId64 } from '../steam/steamId'

/** A linked login the old app kept: `icon` names the service (its own numbering), `name` a custom one. */
export interface V2Credential {
    icon: number | null
    name: string | null
    fields: { kind: CredentialKind; value: string }[]
}

/** One account of the old web app's (v2) export, its fields typed; library stats and the badge tier are left out. */
export interface V2Account {
    login: string
    password: string
    nickname: string | null
    phone: string | null
    note: string | null
    /** SteamID64, read from the file's digits. */
    steamId: string | null
    addedAt: number | null
    /** Registration on Steam. */
    createdAt: number | null
    /** The last refresh from Steam. */
    updatedAt: number | null
    vanity: string | null
    avatar: string | null
    level: number | null
    /** 1 private, 2 friends only, 3 public. */
    visibility: number | null
    vacBans: number | null
    gameBans: number | null
    communityBan: boolean | null
    /** 0 none, 1 probation, 2 banned. */
    economyBan: number | null
    daysSinceLastBan: number | null
    pinned: boolean
    /** The SDA maFile object as the old app stored it. */
    authenticator: Record<string, unknown> | null
    credentials: V2Credential[]
}

const IV_BYTES = 16
const BLOCK_BYTES = 16
// The old app marked its files with this byte at IV positions 3 and 12.
const VERSION = 0x0a
const ITERATIONS = 100_000
const SALT = new TextEncoder().encode('EOtzannXEOSd5HGBSJvs0op1BHRuvFwl')
const ACCOUNT_ID_LIMIT = 2 ** 32
const INTEGER = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y

/** An encrypted export of the old app: its IV carries the version marks and the AES-CBC ciphertext fills whole blocks. */
export function isV2Sealed(bytes: Uint8Array): boolean {
    return (
        bytes.length >= IV_BYTES + BLOCK_BYTES &&
        (bytes.length - IV_BYTES) % BLOCK_BYTES === 0 &&
        bytes[3] === VERSION &&
        bytes[12] === VERSION
    )
}

async function v2Key(password: string) {
    const material = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', hash: 'SHA-1', salt: SALT, iterations: ITERATIONS },
        material,
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt'],
    )
}

/** Opens an encrypted export; a wrong password fails the padding or leaves no accounts to read: `WrongPasswordError`. */
export async function openV2Export(
    bytes: Uint8Array<ArrayBuffer>,
    password: string,
): Promise<V2Account[]> {
    const plain = await checked(
        crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: bytes.subarray(0, IV_BYTES) },
            await v2Key(password),
            bytes.subarray(IV_BYTES),
        ),
    )
    let json: string
    try {
        json = new TextDecoder('utf-8', { fatal: true }).decode(plain)
    } catch {
        throw new WrongPasswordError()
    }
    const accounts = readV2Export(json)
    if (!accounts) throw new WrongPasswordError()
    return accounts
}

/** Integers past 2^53 become strings before parsing, so a SteamID64 keeps its digits; strings are skipped whole. */
function losslessParse(text: string): unknown {
    let out = ''
    let from = 0
    let at = 0
    while (at < text.length) {
        const char = text[at] as string
        if (char === '"') {
            at++
            while (at < text.length && text[at] !== '"')
                at += text[at] === '\\' ? 2 : 1
            at++
            continue
        }
        if (char !== '-' && (char < '0' || char > '9')) {
            at++
            continue
        }
        INTEGER.lastIndex = at
        const number = INTEGER.exec(text)?.[0] ?? char
        if (/^-?\d+$/.test(number) && !Number.isSafeInteger(Number(number))) {
            out += `${text.slice(from, at)}"${number}"`
            from = at + number.length
        }
        at += number.length
    }
    return JSON.parse(out + text.slice(from))
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown) =>
    typeof value === 'string' && value !== '' ? value : null
const number = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : null
function time(value: unknown) {
    if (typeof value !== 'string' && typeof value !== 'number') return null
    const at = new Date(value).getTime()
    return Number.isNaN(at) ? null : at
}

/** Below 2^32 the old app kept the account ID; anything larger is a SteamID64 already. */
function steamIdOf(value: unknown): string | null {
    if (typeof value === 'number' && Number.isInteger(value))
        return value > 0 && value < ACCOUNT_ID_LIMIT
            ? toSteamId64(String(value))
            : null
    if (typeof value !== 'string' || !/^\d{17}$/.test(value)) return null
    const accountId = Number(toAccountId(value))
    return accountId > 0 && accountId < ACCOUNT_ID_LIMIT ? value : null
}

function credentialOf(value: unknown): V2Credential | null {
    if (!isObject(value) || !isObject(value.f)) return null
    const fields = Object.entries(value.f).flatMap(([index, raw]) => {
        const kind = CREDENTIAL_KINDS[Number(index)]
        const filled = text(raw)
        return kind && filled ? [{ kind, value: filled }] : []
    })
    return {
        icon: number(value.i),
        name: text(value.n),
        fields,
    }
}

function accountOf(value: Record<string, unknown>): V2Account {
    const phone = value.phone
    return {
        login: value.login as string,
        password: typeof value.password === 'string' ? value.password : '',
        nickname: text(value.nickname),
        phone:
            typeof phone === 'number' || typeof phone === 'string'
                ? text(String(phone))
                : null,
        note: text(value.note),
        steamId: steamIdOf(value.id),
        addedAt: time(value.addedDate),
        createdAt: time(value.createdDate),
        updatedAt: time(value.lastUpdateDate),
        vanity: text(value.vanityUrl),
        avatar: text(value.avatarHash),
        level: number(value.steamLevel),
        visibility: number(value.visibilityState),
        vacBans: number(value.vacBansCount),
        gameBans: number(value.gameBansCount),
        communityBan:
            typeof value.haveCommunityBan === 'boolean'
                ? value.haveCommunityBan
                : null,
        economyBan: number(value.economyBan),
        daysSinceLastBan: number(value.daysSinceLastBan),
        // The old app kept where a pinned account came from; an unpinned one has none.
        pinned: number(value.unpinIndex) !== null,
        authenticator: isObject(value.authenticator)
            ? value.authenticator
            : null,
        credentials: Array.isArray(value.credentials)
            ? value.credentials.flatMap((one) => credentialOf(one) ?? [])
            : [],
    }
}

/** A plain export: an array of accounts, or `{ timestamp, data }` around one; null for anything else. */
export function readV2Export(source: string): V2Account[] | null {
    let parsed: unknown
    try {
        parsed = losslessParse(source)
    } catch {
        return null
    }
    const list = isObject(parsed) ? parsed.data : parsed
    if (!Array.isArray(list)) return null
    const valid = list.every(
        (item) => isObject(item) && typeof item.login === 'string',
    )
    return valid ? (list as Record<string, unknown>[]).map(accountOf) : null
}
