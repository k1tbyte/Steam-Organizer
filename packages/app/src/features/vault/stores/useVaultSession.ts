import {
    createVault,
    openSecret,
    restampEdited,
    changePassword as rewrapPassword,
    type SealedRecord,
    type StoredVault,
    steamCache,
    type VaultFile,
    type VaultKey,
    type VaultSlots,
    type VaultSync,
    WrongPasswordError,
    writeRecords,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import {
    LAST_VAULT_STORAGE_KEY,
    readStored,
    reportError,
    useMock,
    writeStored,
} from '#core'

import { demoVerify, sessionMock } from '../mocks'
import type { Credential, SessionState, UnlockResult } from '../model'
import { opens, openVault, withCopySlots } from '../services/openVault'
import { restoredRecords } from '../services/restoredRecords'
import {
    EMPTY_CONTENTS,
    type OpenVault,
    openContents,
    type VaultContents,
    withChanges,
} from '../services/vaultContents'
import { FIRST_PUSH, newVault, pendingIn } from '../services/vaultSync'
import { recordKeyring } from './recordKeys'
import { vaultFiles } from './vaultFiles'
import { vaultSyncSide } from './vaultSyncSide'

/** Whether a vault is open: the router guard reads `state`, the lock button and unlock flow write it.
 *  Vaults on this device come from `@so/core`; a mock vault (mock mode, Drive restore) takes the demo credentials. */
export const useVaultSession = defineStore('vault-session', () => {
    // Unwrapped by unlock, kept through the opening animation until `open()`.
    const opened = shallowRef<OpenVault | null>(null)
    const recordKeys = recordKeyring()
    // A lock meanwhile keeps the key dropped; the list still takes the new file, or the old one would open again.
    const files = vaultFiles((vault, contents) => {
        const active = opened.value
        if (active?.vault.id === vault.id)
            opened.value = {
                vault,
                key: active.key,
                contents: contents ?? active.contents,
            }
    })
    const { serial, get: storedVault, save, persist } = files
    // A lock meanwhile still lets an accepted change land, on records read again from the file.
    const contentsOf = async (vault: StoredVault, key: VaultKey) =>
        opened.value?.vault === vault
            ? opened.value.contents
            : openContents(key, vault.file)
    const sync = vaultSyncSide(files, opened, recordKeys, contentsOf)
    const unlocked = ref(false)
    const lastVaultId = ref(readStored(LAST_VAULT_STORAGE_KEY))

    const real = computed<SessionState | undefined>(() => {
        if (unlocked.value) return 'unlocked'
        if (!files.list.value) return undefined
        return files.list.value.length ? 'locked' : 'new'
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

    const drafts = new Set<() => void>()

    function lock() {
        // Drafts queue their writes while the key is still here; the queue lands them after.
        for (const flush of drafts) flush()
        sync.checkpoint(opened.value)
        opened.value = null
        recordKeys.clear()
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
        const id = opened.value?.vault.id
        if (!id) return
        lastVaultId.value = id
        writeStored(LAST_VAULT_STORAGE_KEY, id)
    }

    /** Unwraps the picked vault's key, or the first one's. When this device's slots refuse the password, `copy`
     *  (the vault's Drive copy) is tried: a password changed on another device opens the same key. */
    async function unlock(
        credential: Credential,
        vaultId?: string,
        copy?: VaultFile,
    ): Promise<UnlockResult> {
        const vault = vaultId ? storedVault(vaultId) : files.list.value?.[0]
        if (!vault) return (await demoVerify(credential)) ? 'opened' : 'wrong'
        // PIN and Hello slots come later; such a vault lists the password only.
        if (credential.method !== 'pw') return 'wrong'
        const { password } = credential
        let key = await opens(vault.file, password)
        const viaCopy = key === 'wrong' && copy?.id === vault.id ? copy : null
        if (viaCopy) key = await opens(viaCopy, password)
        if (typeof key === 'string') return key
        const unwrapped = key
        // In the queue, from the latest file: a write that lands meanwhile is never undone.
        return serial(async () => {
            // Removed meanwhile: opening or upgrading it would bring it back. Opened by another flow: that one stays.
            const latest = storedVault(vault.id)
            if (!latest || unlocked.value) return 'unreadable'
            const file = viaCopy
                ? await withCopySlots(latest.file, unwrapped, viaCopy)
                : latest.file
            if (file === 'wrong') return 'wrong'
            try {
                // A recovery slot only from the password these slots take.
                const own = !viaCopy || file.slots === viaCopy.slots
                const next = await openVault(
                    file,
                    unwrapped,
                    own ? password : undefined,
                )
                const changed = next.upgraded ?? file
                const stored =
                    changed === latest.file
                        ? latest
                        : await save(latest, changed)
                opened.value = {
                    vault: stored,
                    key: next.key,
                    contents: next.contents,
                }
                const current = opened.value
                // Accounts deleted before this unlock leave their Steam cache; one deleted since may yet come back by Undo,
                // and a lock or another vault keeps all.
                steamCache
                    .pruneCollections(
                        next.key,
                        (id) =>
                            next.contents.data.has(id) ||
                            opened.value?.key !== current.key ||
                            opened.value.contents.data.has(id),
                    )
                    .catch((error) => reportError(error, 'steam-cache'))
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
        return (
            typeof (await opens(vault.file, credential.password)) !== 'string'
        )
    }

    /** Creates a vault on this device and opens it; `sync` links it to Drive, so its first sync pushes it. */
    async function create(name: string, password: string, sync = false) {
        const { file, key } = await createVault(password)
        const vault = newVault(name, file, sync ? FIRST_PUSH : undefined)
        await storeOpen({ vault, key, contents: EMPTY_CONTENTS })
    }

    const storeOpen = (next: OpenVault) =>
        persist(next.vault, undefined, () => {
            opened.value = next
            open()
        })

    /** Stores a vault file from elsewhere (a Drive backup or copy) on this device, replacing one with its id, and opens it.
     *  `sync` links it to the Drive copy it came from. An aborted `signal` stops it with its reason up to the write;
     *  a write begun finishes and opens. */
    async function adopt(
        name: string,
        file: VaultFile,
        password: string,
        signal?: AbortSignal,
        sync?: Pick<VaultSync, 'account' | 'copyId' | 'version'>,
    ): Promise<UnlockResult> {
        const key = await opens(file, password)
        if (typeof key === 'string') return key
        return serial(async () => {
            try {
                signal?.throwIfAborted()
                const next = await openVault(file, key, password)
                signal?.throwIfAborted()
                // The copy as adopted is what its link holds: a recovery slot added now is a change to push.
                const baseline = newVault(
                    name,
                    file,
                    sync && { ...sync, revision: 0, syncedAt: Date.now() },
                )
                const vault = next.upgraded
                    ? files.withFile(baseline, next.upgraded)
                    : baseline
                files.relink(vault.id)
                await storeOpen({ ...next, vault })
                return 'opened'
            } catch (error) {
                if (signal?.aborted) throw error
                reportError(error, 'vault-session', { vault: file.id })
                return 'unreadable'
            }
        })
    }

    /** Deletes a vault from this device after the writes queued before it. The open one drops its key and Steam cache,
     *  so the state turns `locked` or `new` and the guard moves the page. */
    function remove(id: string): Promise<void> {
        return serial(async () => {
            await files.remove(id)
            const active = opened.value
            if (active?.vault.id !== id) return
            opened.value = null
            recordKeys.clear()
            unlocked.value = false
            override.value = null
            steamCache
                .pruneCollections(active.key, () => false)
                .catch((error) => reportError(error, 'steam-cache'))
        })
    }

    /** Renames the open vault; the name labels it on this device and never enters the file. */
    function rename(name: string): Promise<void> {
        const id = opened.value?.vault.id
        if (id === undefined) return Promise.resolve()
        return serial(async () => {
            const vault = storedVault(id)
            if (vault) await persist({ ...vault, name })
        })
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
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault) return
            // Still open, its key may have taken another recovery half from a merge queued before.
            const key =
                opened.value?.vault.id === vault.id
                    ? opened.value.key
                    : target.key
            const current = await contentsOf(vault, key)
            const changed = await change(current, key)
            if (changed.length === 0) return
            const contents = await withChanges(key, current, changed)
            const file = await writeRecords(key, vault.file, contents.records)
            await save(vault, file, contents)
        })
    }

    /** Makes another copy's records (a backup, an export) the open vault's: each stamped now, the rest tombstoned. */
    async function replaceRecords(records: readonly SealedRecord[]) {
        const restored: string[] = []
        await transact(async (contents, key) => {
            const now = Date.now()
            const changed = restoredRecords(contents.records, records, now)
            restored.push(...changed.map(({ id }) => id))
            return Promise.all(
                changed.map((record) =>
                    'deleted' in record
                        ? record
                        : restampEdited(key, record, now),
                ),
            )
        })
        // A locked account may come back sealed under its key of that time.
        for (const id of restored) recordKeys.drop(id)
    }

    /** The open vault's latest file and records, read in the queue: a write accepted before lands first. */
    function snapshot(): Promise<
        { file: VaultFile; contents: VaultContents } | undefined
    > {
        const target = opened.value
        if (!target) return Promise.resolve(undefined)
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault) return undefined
            return {
                file: vault.file,
                contents: await contentsOf(vault, target.key),
            }
        })
    }

    /** Opens one record's secret part, with the record's own key when one is held; undefined while no vault is open or it holds no such record. */
    async function secretOf<Secret>(id: string): Promise<Secret | undefined> {
        const target = opened.value
        const record = target?.contents.records.find((found) => found.id === id)
        if (!target || !record || 'deleted' in record) return undefined
        return openSecret<Secret>(target.key, record, recordKeys.get(id))
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
        vaults: computed(() => files.list.value ?? []),
        /** The open vault's id, name, home and Drive sync (`pending`: changes the copy lacks); null while none is open. */
        vault: computed(() => {
            const vault = opened.value?.vault
            if (!vault) return null
            const { sync } = vault
            return {
                id: vault.id,
                name: vault.name,
                home: vault.home,
                sync: sync
                    ? { syncedAt: sync.syncedAt, pending: pendingIn(vault) }
                    : null,
            }
        }),
        /** The vault opened last on this device, if any. */
        lastVaultId: computed(() => lastVaultId.value),
        /** The open vault's records; null while none is open (mock mode, the demo restore). */
        contents: computed(() => opened.value?.contents ?? null),
        load: files.load,
        lock,
        onBeforeLock,
        onLocked: sync.onLocked,
        open,
        unlock,
        verify,
        create,
        adopt,
        remove,
        rename,
        link: sync.link,
        unlink: sync.unlink,
        mergeCopy: sync.mergeCopy,
        markSynced: sync.markSynced,
        changePassword,
        transact,
        replaceRecords,
        snapshot,
        secretOf,
        withKey,
        /** A record's held key, reactive; undefined while it is locked. */
        keyOf: recordKeys.get,
        /** Holds a record's own key (a locked account opened) until it is dropped or the vault locks. Take the holder
         *  before the key starts opening: it refuses a key once the record was dropped or the vault locked meanwhile. */
        keyHolder: recordKeys.holder,
        dropKey: recordKeys.drop,
    }
})
