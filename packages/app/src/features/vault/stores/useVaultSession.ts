import {
    createVault,
    openSecret,
    changePassword as rewrapPassword,
    type SealedRecord,
    type StoredVault,
    unlockVault,
    type VaultFile,
    type VaultKey,
    type VaultSlots,
    vaultStore,
    WrongPasswordError,
    withRecovery,
    writeRecords,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import { reportError, useMock } from '#core'

import { DEMO_PASSWORD, DEMO_PIN, sessionMock } from '../mocks'
import type { Credential, SessionState, UnlockResult } from '../model'
import {
    EMPTY_CONTENTS,
    openContents,
    type VaultContents,
    withChanges,
} from '../services/vaultContents'

interface OpenVault {
    vault: StoredVault
    key: VaultKey
    contents: VaultContents
}

// Stands in for the Windows Hello prompt.
const HELLO_DELAY_MS = 1300

async function demoVerify(credential: Credential) {
    if (credential.method === 'bio') {
        await new Promise((resolve) => setTimeout(resolve, HELLO_DELAY_MS))
        return true
    }
    return credential.method === 'pin'
        ? credential.pin === DEMO_PIN
        : credential.password === DEMO_PASSWORD
}

async function opens(
    vault: StoredVault,
    password: string,
): Promise<VaultKey | Exclude<UnlockResult, 'opened'>> {
    try {
        return await unlockVault(vault.file, password)
    } catch (error) {
        if (error instanceof WrongPasswordError) return 'wrong'
        reportError(error, 'vault-session', { vault: vault.id })
        return 'unreadable'
    }
}

/** Whether a vault is open: the router guard reads `state`, the lock button and unlock flow write it.
 *  Vaults on this device come from `@so/core`; a mock vault (mock mode, Drive restore) takes the demo credentials. */
export const useVaultSession = defineStore('vault-session', () => {
    // Null until `load()`: the autofill entry never calls it, so a Steam page's storage stays untouched.
    const vaults = shallowRef<StoredVault[] | null>(null)
    let loading: Promise<void> | null = null
    // Unwrapped by unlock, kept through the opening animation until `open()`.
    const opened = shallowRef<OpenVault | null>(null)
    // Keys of records sealed apart from the vault key, opened this session; reactive so a lock shows at once.
    const recordKeys = shallowRef(new Map<string, CryptoKey>())
    // Bumped by every lock and every drop, so a key that opens late never undoes either.
    let keyEpoch = 0
    const drops = new Map<string, number>()
    // One writer at a time: each change reads the latest file inside the queue, so none restores an older one.
    let queue: Promise<unknown> = Promise.resolve()
    function serial<T>(task: () => Promise<T>): Promise<T> {
        const run = queue.then(task)
        queue = run.catch(() => {})
        return run
    }
    const unlocked = ref(false)

    const real = computed<SessionState | undefined>(() => {
        if (unlocked.value) return 'unlocked'
        if (!vaults.value) return undefined
        return vaults.value.length ? 'locked' : 'new'
    })
    const mocked = useMock(() => real.value, sessionMock)
    // Lets lock and open flip a mocked state; any change underneath clears it.
    const override = ref<SessionState | null>(null)
    watch(mocked, () => {
        override.value = null
    })
    const state = computed<SessionState>(
        () => override.value ?? mocked.value ?? 'new',
    )

    function load() {
        loading ??= vaultStore
            .list()
            .catch((error) => {
                reportError(error, 'vault-session')
                return []
            })
            .then((list) => {
                vaults.value = list
            })
        return loading
    }

    const drafts = new Set<() => void>()

    function lock() {
        // Drafts queue their writes while the key is still here; the queue lands them after.
        for (const flush of drafts) flush()
        opened.value = null
        recordKeys.value = new Map()
        keyEpoch++
        unlocked.value = false
        override.value = 'locked'
    }

    /** Runs `flush` at every lock, before the key drops; returns the unsubscribe. */
    function onBeforeLock(flush: () => void) {
        drafts.add(flush)
        return () => drafts.delete(flush)
    }

    /** A vault was created, restored or unlocked. */
    function open() {
        unlocked.value = true
        override.value = 'unlocked'
    }

    /** Unwraps the picked vault's key, or the first one's. */
    async function unlock(
        credential: Credential,
        vaultId?: string,
    ): Promise<UnlockResult> {
        const vault = vaultId
            ? vaults.value?.find((item) => item.id === vaultId)
            : vaults.value?.[0]
        if (!vault) return (await demoVerify(credential)) ? 'opened' : 'wrong'
        // PIN and Hello slots come later; such a vault lists the password only.
        if (credential.method !== 'pw') return 'wrong'
        const key = await opens(vault, credential.password)
        if (typeof key === 'string') return key
        // In the queue, from the latest file: a write that lands meanwhile is never undone.
        return serial(async () => {
            const latest = storedVault(vault.id) ?? vault
            try {
                const contents = await openContents(key, latest.file)
                const upgraded = await withRecovery(
                    latest.file,
                    key,
                    credential.password,
                )
                const current = upgraded
                    ? { ...latest, file: upgraded.file }
                    : latest
                if (upgraded) {
                    await vaultStore.put(current)
                    remember(current)
                }
                opened.value = {
                    vault: current,
                    key: upgraded?.key ?? key,
                    contents,
                }
                return 'opened'
            } catch (error) {
                reportError(error, 'vault-session', { vault: vault.id })
                return 'unreadable'
            }
        })
    }

    /** Checks the open vault's master password without touching the session. */
    async function verify(credential: Credential): Promise<boolean> {
        const vault = opened.value?.vault
        if (!vault || credential.method !== 'pw') return demoVerify(credential)
        return typeof (await opens(vault, credential.password)) !== 'string'
    }

    // Inside the queue the list holds each vault's latest file: every save lands there, lock or not.
    const storedVault = (id: string) =>
        vaults.value?.find((item) => item.id === id)

    function remember(vault: StoredVault) {
        vaults.value = [
            ...(vaults.value ?? []).filter((item) => item.id !== vault.id),
            vault,
        ]
    }

    /** Creates a vault on this device and opens it. */
    async function create(name: string, password: string) {
        const { file, key } = await createVault(password)
        const vault: StoredVault = { id: file.id, name, home: 'device', file }
        await vaultStore.put(vault)
        // One synchronous step: the guard never sees the stored vault as locked.
        opened.value = { vault, key, contents: EMPTY_CONTENTS }
        open()
        remember(vault)
    }

    async function save(
        stored: StoredVault,
        file: VaultFile,
        contents?: VaultContents,
    ) {
        const vault = { ...stored, file }
        await vaultStore.put(vault)
        // A lock meanwhile keeps the key dropped; the list still takes the new file, or the old one would open again.
        const active = opened.value
        if (active?.vault.id === vault.id)
            opened.value = {
                vault,
                key: active.key,
                contents: contents ?? active.contents,
            }
        remember(vault)
    }

    /** Writes the records `change` returns to the vault open now; it runs in the queue on the latest records, so changes to one record never overwrite each other. */
    function transact(
        change: (
            contents: VaultContents,
            key: VaultKey,
        ) => Promise<readonly SealedRecord[]>,
    ): Promise<void> {
        const target = opened.value
        if (!target) return Promise.resolve()
        const { key } = target
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault) return
            // A lock meanwhile still lets an accepted change land, on records read again from the file.
            const current =
                opened.value?.vault === vault
                    ? opened.value.contents
                    : await openContents(key, vault.file)
            const changed = await change(current, key)
            if (changed.length === 0) return
            const contents = await withChanges(key, current, changed)
            const file = await writeRecords(key, vault.file, contents.records)
            await save(vault, file, contents)
        })
    }

    /** Opens one record's secret part, with the record's own key when one is held; undefined while no vault is open or it holds no such record. */
    async function secretOf<Secret>(id: string): Promise<Secret | undefined> {
        const target = opened.value
        const record = target?.contents.records.find((found) => found.id === id)
        if (!target || !record || 'deleted' in record) return undefined
        return openSecret<Secret>(target.key, record, recordKeys.value.get(id))
    }

    /** Holds a record's own key (a locked account opened) until it is dropped or the vault locks. Take the holder before
     *  the key starts opening: it refuses a key once the record was dropped or the vault locked meanwhile. */
    function keyHolder(id: string) {
        const epoch = keyEpoch
        const drop = drops.get(id) ?? 0
        return (key: CryptoKey) => {
            if (epoch !== keyEpoch || drop !== (drops.get(id) ?? 0)) return
            recordKeys.value = new Map(recordKeys.value).set(id, key)
        }
    }

    function dropKey(id: string) {
        drops.set(id, (drops.get(id) ?? 0) + 1)
        if (!recordKeys.value.has(id)) return
        const next = new Map(recordKeys.value)
        next.delete(id)
        recordKeys.value = next
    }

    /** Runs `use` with the open vault's key and slots, outside the write queue: opening a locked account writes nothing. */
    async function withKey<T>(
        use: (key: VaultKey, slots: VaultSlots) => Promise<T>,
    ): Promise<T | undefined> {
        const target = opened.value
        return target ? use(target.key, target.vault.file.slots) : undefined
    }

    function changePassword(current: string, next: string): Promise<boolean> {
        const id = opened.value?.vault.id
        if (id === undefined)
            return demoVerify({ method: 'pw', password: current })
        return serial(async () => {
            const vault = storedVault(id)
            if (!vault) return false
            try {
                await save(
                    vault,
                    await rewrapPassword(vault.file, current, next),
                )
                return true
            } catch (error) {
                if (error instanceof WrongPasswordError) return false
                throw error
            }
        })
    }

    return {
        state,
        vaults: computed(() => vaults.value ?? []),
        /** The open vault's records; null while none is open (mock mode, the demo restore). */
        contents: computed(() => opened.value?.contents ?? null),
        load,
        lock,
        onBeforeLock,
        open,
        unlock,
        verify,
        create,
        changePassword,
        transact,
        secretOf,
        withKey,
        /** A record's held key, reactive; undefined while it is locked. */
        keyOf: (id: string) => recordKeys.value.get(id),
        keyHolder,
        dropKey,
    }
})
