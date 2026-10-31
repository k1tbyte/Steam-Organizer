import {
    createVault,
    openSecret,
    changePassword as rewrapPassword,
    type SealedRecord,
    type StoredVault,
    steamCache,
    type VaultFile,
    type VaultKey,
    type VaultSlots,
    type VaultSync,
    vaultStore,
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

import { DEMO_PASSWORD, DEMO_PIN, sessionMock } from '../mocks'
import type {
    Credential,
    LockedSnapshot,
    MergedCopy,
    SessionState,
    UnlockResult,
} from '../model'
import { opens, openVault, withCopySlots } from '../services/openVault'
import { restoredRecords } from '../services/restoredRecords'
import {
    EMPTY_CONTENTS,
    openContents,
    type VaultContents,
    withChanges,
} from '../services/vaultContents'
import {
    FIRST_PUSH,
    mergeCopyInto,
    newVault,
    pendingIn,
} from '../services/vaultSync'
import { recordKeyring } from './recordKeys'
import { vaultFiles } from './vaultFiles'

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
    const lockWatchers = new Set<
        (snapshot: Promise<LockedSnapshot | undefined>) => void
    >()

    function lock() {
        // Drafts queue their writes while the key is still here; the queue lands them after.
        for (const flush of drafts) flush()
        const linked = opened.value?.vault.sync ? opened.value.vault.id : null
        if (linked !== null && lockWatchers.size) {
            // Queued after the drafts, so it holds what they wrote; the file is sealed, no key needed.
            const snapshot = serial(async () => {
                const vault = storedVault(linked)
                return vault && pendingIn(vault)
                    ? { file: vault.file, receipt: files.receipt(vault) }
                    : undefined
            })
            for (const watcher of lockWatchers) watcher(snapshot)
        }
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

    /** Hands `watcher` every lock of a linked vault: the file it left with changes still to push, read after the drafts. */
    function onLocked(
        watcher: (snapshot: Promise<LockedSnapshot | undefined>) => void,
    ) {
        lockWatchers.add(watcher)
        return () => lockWatchers.delete(watcher)
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
            // Removed meanwhile: opening or upgrading it would bring it back.
            const latest = storedVault(vault.id)
            if (!latest) return 'unreadable'
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

    async function storeOpen(next: OpenVault) {
        await vaultStore.put(next.vault)
        // One synchronous step: the guard never sees the stored vault as locked.
        opened.value = next
        open()
        files.remember(next.vault)
    }

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

    /** Merges the open linked vault with `copy`, its file on Drive, in the queue on the latest file; without one it only
     *  reads the file to push. A copy the key can't open throws and writes nothing. Undefined without an open linked vault. */
    function mergeCopy(
        copy: VaultFile | null,
    ): Promise<MergedCopy | undefined> {
        const target = opened.value
        if (!target?.vault.sync) return Promise.resolve(undefined)
        const { key } = target
        return serial(async () => {
            const vault = storedVault(target.vault.id)
            if (!vault?.sync) return undefined
            if (!copy)
                return {
                    file: vault.file,
                    receipt: files.receipt(vault),
                    push: pendingIn(vault),
                }
            const current = await contentsOf(vault, key)
            const merged = await mergeCopyInto(key, vault, current, copy)
            const stored = merged.changed
                ? await save(
                      vault,
                      merged.changed.file,
                      merged.changed.contents,
                  )
                : vault
            // A locked account may come back sealed under another key.
            for (const id of merged.taken) recordKeys.drop(id)
            return {
                file: stored.file,
                receipt: files.receipt(stored),
                push: merged.push,
            }
        })
    }

    // A lock meanwhile still lets an accepted change land, on records read again from the file.
    const contentsOf = async (vault: StoredVault, key: VaultKey) =>
        opened.value?.vault === vault
            ? opened.value.contents
            : openContents(key, vault.file)

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
        await transact(async (contents) => {
            const changed = restoredRecords(
                contents.records,
                records,
                Date.now(),
            )
            restored.push(...changed.map(({ id }) => id))
            return changed
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
        onLocked,
        open,
        unlock,
        verify,
        create,
        adopt,
        remove,
        rename,
        /** Links the open vault to Drive: its next sync pushes it, or merges it into the copy Drive has. */
        link: () => files.link(opened.value?.vault.id),
        /** Keeps vault `id` (the open one by default) on this device only. */
        unlink: (id = opened.value?.vault.id) => files.unlink(id),
        mergeCopy,
        /** Records that Drive's copy holds the file a receipt was read with. Needs no open vault; refused for a vault
         *  removed or linked again since. A write after the receipt stays pending. */
        markSynced: files.markSynced,
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
