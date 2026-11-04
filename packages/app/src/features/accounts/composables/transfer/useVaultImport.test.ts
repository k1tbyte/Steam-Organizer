import 'fake-indexeddb/auto'

import {
    type AccountData,
    type AccountSecret,
    changePassword,
    loginTag,
    RECORD,
    readRecords,
    readService,
    readTag,
    sealRecord,
    serializeVaultFile,
    type VaultFile,
    writeRecords,
} from '@so/core'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it, vi } from 'vitest'

import { useVaultSession } from '#features/vault'

import { useVaultServices } from '../../../linked-services/composables/useVaultServices'
import { partialRecords } from '../../services/transfer/partialRecords'
import { useAccountLocks } from '../secrets/useAccountLocks'
import { useEditSecret } from '../secrets/useEditSecret'
import { useVaultTags } from '../tags/useVaultTags'
import { useVaultAccounts } from '../useVaultAccounts'
import { type StagedImport, useVaultImport } from './useVaultImport'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (text: string) => text }) }))
// The facades load components; the import needs only their readers.
vi.mock(
    '#features/linked-services',
    () => import('../../../linked-services/services/vaultServices'),
)
vi.mock(
    '#features/steam-guard',
    () => import('../../../steam-guard/services/maFile'),
)

const MASTER = 'correct horse'
const STEAM_ID = '76561198000000001'

beforeEach(async () => {
    await new Promise((resolve) => {
        indexedDB.deleteDatabase('steam-organizer').onsuccess = resolve
    })
    setActivePinia(createPinia())
})

const bytesOf = (file: VaultFile) =>
    new TextEncoder().encode(serializeVaultFile(file))

function idOf(login: string) {
    const found = useVaultAccounts().accounts.value.find(
        (account) => account.login === login,
    )
    return found?.id as string
}

const logins = () =>
    useVaultAccounts()
        .accounts.value.map(({ login }) => login)
        .sort()

/** The edit bar's export: the picked accounts in a partial file of the open vault. */
async function partialOf(ids: string[]) {
    const session = useVaultSession()
    const latest = await session.snapshot()
    if (!latest) throw new Error('The vault is open')
    const file = await session.withKey(async (key) => {
        const { records } = await partialRecords(key, latest.contents, ids)
        return writeRecords(key, { ...latest.file, partial: true }, records)
    })
    if (!file) throw new Error('The vault is open')
    return file
}

async function confirmed(staged: StagedImport | 'wrong') {
    if (staged === 'wrong' || !('confirm' in staged))
        throw new Error(`Nothing to confirm: ${JSON.stringify(staged)}`)
    return staged.confirm()
}

it("replaces the vault with its own whole file, after the warning's confirm", async () => {
    const session = useVaultSession()
    await session.create('Main', MASTER)
    const vault = useVaultAccounts()
    await vault.add({ login: 'one', password: 'hunter22', steamId: null })
    const whole = (await session.snapshot())?.file as VaultFile
    await vault.add({ login: 'two', password: 'hunter22', steamId: null })

    const staged = await useVaultImport().read(bytesOf(whole))
    expect(staged.step).toBe('replace')
    expect(await confirmed(staged)).toBe(1)
    expect(logins()).toEqual(['one'])
})

it('merges a partial file of this vault: adds what it lacks, the newer stamp wins, nothing is removed', async () => {
    const session = useVaultSession()
    await session.create('Main', MASTER)
    const vault = useVaultAccounts()
    for (const login of ['one', 'two', 'three'])
        await vault.add({ login, password: 'hunter22', steamId: null })
    const partial = await partialOf([idOf('one'), idOf('two')])
    // Since the export: one renamed, two deleted, four added.
    await vault.edit(idOf('one'), { alias: 'Newer' })
    await vault.remove([idOf('two')])
    await vault.add({ login: 'four', password: 'hunter22', steamId: null })
    // The file also holds an account the vault lacks, and one under another id with a login it holds.
    const file = await session.withKey(async (key) => {
        const extra = ['five', 'THREE'].map(async (login) => {
            const data: AccountData = {
                kind: RECORD.ACCOUNT,
                login,
                steamId: null,
                tags: [],
                pinned: false,
                order: 'a9',
                addedAt: 1,
                editedAt: 1,
                guard: false,
                loginTag: await loginTag(key, login),
                steam: null,
            }
            const secret = { password: 'x', services: [] }
            return sealRecord(key, {
                id: crypto.randomUUID(),
                updatedAt: 1,
                data,
                secret,
            })
        })
        return writeRecords(key, partial, [
            ...(await readRecords(key, partial)),
            ...(await Promise.all(extra)),
        ])
    })

    const staged = await useVaultImport().read(bytesOf(file as VaultFile))
    expect(staged).toMatchObject({ step: 'merge', accounts: 4 })
    expect(await confirmed(staged)).toEqual({
        imported: 1,
        skipped: 3,
        locked: 0,
    })
    expect(logins()).toEqual(['five', 'four', 'one', 'three'])
    expect(
        vault.accounts.value.find(({ login }) => login === 'one')?.alias,
    ).toBe('Newer')
})

it("adds another vault's picked accounts sealed under this one: tags and services by name, locked ones counted", async () => {
    const session = useVaultSession()
    await session.create('Other', 'other password')
    const vault = useVaultAccounts()
    await vault.add({ login: 'alpha', password: 'pw-alpha', steamId: STEAM_ID })
    await vault.add({ login: 'beta', password: 'pw-beta', steamId: null })
    await vault.add({ login: 'Main-Dup', password: 'pw', steamId: null })
    const tags = useVaultTags()
    const trade = (await tags.create('Trade', 95)) as string
    const fresh = (await tags.create('Fresh', 25)) as string
    await vault.setTags([idOf('alpha')], { add: [trade, fresh] })
    const origin = (await useVaultServices().create('Origin')) as string
    await useEditSecret()(idOf('alpha'), (secret) => ({
        secret: {
            ...secret,
            services: [
                { service: origin, fields: [{ kind: 'login', value: 'o-1' }] },
                {
                    service: 'discord',
                    fields: [{ kind: 'login', value: 'd-1' }],
                },
            ],
        } satisfies AccountSecret,
    }))
    const locks = useAccountLocks()
    await locks.setLock(idOf('beta'), '1234', 'credentials', true)
    const otherIds = vault.accounts.value.map(({ id }) => id)
    // Exported under a password of its own.
    const exported = await changePassword(
        await partialOf(otherIds),
        'other password',
        'file password',
    )

    await session.create('Main', MASTER)
    await vault.add({ login: 'main-dup', password: 'pw', steamId: null })
    const mainTrade = (await tags.create('trade', 205)) as string

    const staged = await useVaultImport().read(bytesOf(exported))
    expect(staged).toMatchObject({ step: 'password', source: 'vault' })
    if (staged.step !== 'password') return
    expect(await staged.open('other password!')).toBe('wrong')
    const preview = await staged.open('file password')
    expect(preview).toMatchObject({ step: 'add', accounts: 2, locked: 1 })
    expect(await confirmed(preview)).toEqual({
        imported: 1,
        skipped: 1,
        locked: 1,
    })

    expect(logins()).toEqual(['alpha', 'main-dup'])
    const alpha = vault.accounts.value.find(({ login }) => login === 'alpha')
    expect(otherIds).not.toContain(alpha?.id)
    expect(alpha?.tags.map(({ label }) => label).sort()).toEqual([
        'Fresh',
        'trade',
    ])
    expect(alpha?.tags.map(({ id }) => id)).toContain(mainTrade)
    // Sealed under this vault: its key opens the secret, with Origin added here by name.
    const secret = await session.secretOf<AccountSecret>(alpha?.id as string)
    expect(secret?.password).toBe('pw-alpha')
    const services = new Map(
        [...(session.contents?.data ?? [])].flatMap(([id, data]) => {
            const service = readService(data)
            return service ? [[id, service.name] as const] : []
        }),
    )
    expect(
        secret?.services.map(({ service }) => services.get(service) ?? service),
    ).toEqual(['Origin', 'discord'])
    const labels = [...(session.contents?.data.values() ?? [])].flatMap(
        (data) => readTag(data)?.label ?? [],
    )
    expect(labels.sort()).toEqual(['Fresh', 'trade'])
})

it("refuses another vault's whole file and anything that isn't an export", async () => {
    const session = useVaultSession()
    await session.create('Other', 'other password')
    const other = (await session.snapshot())?.file as VaultFile
    await session.create('Main', MASTER)
    const imports = useVaultImport()
    expect((await imports.read(bytesOf(other))).step).toBe('other-vault')
    for (const text of [
        '{"format":"steam-organizer-vault","version":2}',
        'plain text',
    ])
        expect((await imports.read(new TextEncoder().encode(text))).step).toBe(
            'unreadable',
        )
})

/** The old app's encrypted export (PBKDF2-SHA-1, AES-CBC, an IV marked at bytes 3 and 12), made here. */
async function v2Sealed(password: string, json: string) {
    const encoder = new TextEncoder()
    const material = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    )
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            hash: 'SHA-1',
            salt: encoder.encode('EOtzannXEOSd5HGBSJvs0op1BHRuvFwl'),
            iterations: 100_000,
        },
        material,
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt'],
    )
    const iv = crypto.getRandomValues(new Uint8Array(16))
    iv[3] = iv[12] = 0x0a
    const cipher = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        encoder.encode(json),
    )
    const bytes = new Uint8Array(16 + cipher.byteLength)
    bytes.set(iv)
    bytes.set(new Uint8Array(cipher), 16)
    return bytes
}

// The old app kept 32-bit account IDs: 39734273 is STEAM_ID, which the vault holds.
const OLD_ACCOUNTS = JSON.stringify([
    {
        login: 'NOVA',
        password: 'dup by login',
        addedDate: '2023-01-01T00:00:00.000Z',
    },
    {
        login: 'other',
        password: 'dup by Steam ID',
        id: 39734273,
        addedDate: '2023-01-01T00:00:00.000Z',
    },
    {
        nickname: 'zed_persona',
        login: 'zed',
        password: 'pw-zed',
        phone: 79001234567,
        note: 'main trader',
        id: 1000,
        avatarHash: 'abc',
        steamLevel: 12,
        unpinIndex: 0,
        addedDate: '2022-05-01T00:00:00.000Z',
        authenticator: {
            shared_secret: 'c2VjcmV0',
            account_name: 'zed',
            revocation_code: 'R123',
        },
        credentials: [
            { i: 51, f: { 1: 'zed@example.com' } },
            { i: 52, f: { 0: 'zed_epic', 2: 'epic-pw' } },
            { i: 56, f: { 0: 'zed_zm' } },
        ],
    },
    {
        nickname: 'Smurf',
        login: 'smurf',
        password: 'pw-smurf',
        addedDate: '2024-01-01T00:00:00.000Z',
    },
])

async function vaultForOldFiles() {
    const session = useVaultSession()
    await session.create('Main', MASTER)
    const vault = useVaultAccounts()
    await vault.add({ login: 'nova', password: 'hunter22', steamId: null })
    await vault.add({ login: 'held', password: 'hunter22', steamId: STEAM_ID })
    return { session, vault }
}

it("adds the old app's accounts, skipping those already here by Steam ID or login", async () => {
    const { session, vault } = await vaultForOldFiles()
    const staged = await useVaultImport().read(
        new TextEncoder().encode(OLD_ACCOUNTS),
    )
    expect(staged).toMatchObject({ step: 'add', accounts: 4 })
    expect(await confirmed(staged)).toEqual({
        imported: 2,
        skipped: 2,
        locked: 0,
    })

    expect(logins()).toEqual(['held', 'nova', 'smurf', 'zed'])
    const zed = vault.accounts.value.find(({ login }) => login === 'zed')
    expect(zed).toMatchObject({
        pinned: true,
        note: 'main trader',
        guard: true,
        steamId: '1000',
        steamNickname: 'zed_persona',
        level: 12,
    })
    expect(
        vault.accounts.value.find(({ login }) => login === 'smurf')?.alias,
    ).toBe('Smurf')
    const secret = await session.secretOf<AccountSecret>(zed?.id as string)
    expect(secret).toMatchObject({
        password: 'pw-zed',
        phone: '79001234567',
        email: 'zed@example.com',
        authenticator: { sharedSecret: 'c2VjcmV0', revocationCode: 'R123' },
    })
    const names = new Map(
        [...(session.contents?.data ?? [])].flatMap(([id, data]) => {
            const service = readService(data)
            return service ? [[id, service.name] as const] : []
        }),
    )
    expect(
        secret?.services.map(({ service, fields }) => [
            names.get(service) ?? service,
            fields,
        ]),
    ).toEqual([
        [
            'epic',
            [
                { kind: 'login', value: 'zed_epic' },
                { kind: 'password', value: 'epic-pw' },
            ],
        ],
        ['ZeniMax', [{ kind: 'login', value: 'zed_zm' }]],
    ])
})

it("opens the old app's encrypted file with its password, and says when it's wrong", async () => {
    await vaultForOldFiles()
    const staged = await useVaultImport().read(
        await v2Sealed('old password', OLD_ACCOUNTS),
    )
    expect(staged).toMatchObject({ step: 'password', source: 'v2' })
    if (staged.step !== 'password') return
    expect(await staged.open('wrong')).toBe('wrong')
    const preview = await staged.open('old password')
    expect(await confirmed(preview)).toEqual({
        imported: 2,
        skipped: 2,
        locked: 0,
    })
    expect(logins()).toEqual(['held', 'nova', 'smurf', 'zed'])
})
