import {
    createVault,
    changePassword as rewrapPassword,
    type Sealed,
    type SecretSlot,
    type StoredVault,
    steamCache,
    type VaultFile,
    type VaultKey,
    type VaultSync,
    WrongPasswordError,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import {
    LAST_VAULT_STORAGE_KEY,
    mocksOn,
    readStored,
    reportError,
    useMock,
    writeStored,
} from '#core'

import { demoVerify, sessionMock } from '../mocks'
import type {
    Credential,
    SecuritySettings,
    SessionState,
    UnlockResult,
} from '../model'
import {
    armAfterPassword,
    movePlaced,
    sealForDevice,
} from '../services/device/deviceSlots'
import { readSecuritySettings } from '../services/device/lockPolicy'
import { passkeySlot } from '../services/device/passkey'
import { tryPin } from '../services/device/pinSlots'
import {
    opens,
    opensPassword,
    openVault,
    passwordSlotOf,
    withCopySlots,
} from '../services/openVault'
import {
    EMPTY_CONTENTS,
    type OpenVault,
    openContents,
} from '../services/vaultContents'
import { FIRST_PUSH, newVault, pendingIn } from '../services/vaultSync'
import { deviceFacts } from './deviceFacts'
import { keptRestore } from './keptRestore'
import { keptSession } from './keptSession'
import { recordKeyring } from './recordKeys'
import { vaultFiles } from './vaultFiles'
import { vaultRecords } from './vaultRecords'
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
    const records = vaultRecords(files, opened, recordKeys, contentsOf)
    const kept = keptSession()
    const device = deviceFacts()
    const revival = keptRestore(kept, {
        vaultIds: () => (files.list.value ?? []).map(({ id }) => id),
        vault: storedVault,
        lastVaultId: () => lastVaultId.value ?? undefined,
        unlocked: () => unlocked.value,
        openedId: () => opened.value?.vault.id,
        epoch: () => epoch,
        refreshVaults: () =>
            opened.value ? Promise.resolve() : files.refresh(),
        openRestored: (vault, slot) =>
            openWith(vault, slot, { restored: true }),
        open,
        lockLocal,
    })
    const unlocked = ref(false)
    // Held back while `load()` looks for a kept session, so a restore never flashes the locked screen.
    const restoring = ref(false)
    // Bumped by every lock: an answer that began before one (a slow restore) never opens.
    let epoch = 0
    const lastVaultId = ref(readStored(LAST_VAULT_STORAGE_KEY))

    const real = computed<SessionState | undefined>(() => {
        if (unlocked.value) return 'unlocked'
        if (!files.list.value || restoring.value) return undefined
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

    // Locks this page only: the kept entry stays, for a lock another page made already.
    function lockLocal() {
        // Drafts queue their writes while the key is still here; the queue lands them after.
        for (const flush of drafts) flush()
        sync.checkpoint(opened.value)
        if (opened.value || unlocked.value) epoch++
        opened.value = null
        recordKeys.clear()
        kept.release()
        unlocked.value = false
        override.value = 'locked'
    }

    /** Locks every page: the kept entry goes (and its copy on disk), which the other pages' watch hears. */
    function lock() {
        const id = opened.value?.vault.id
        lockLocal()
        if (id) void kept.drop(id)
    }

    /** Runs `flush` at every lock, before the key drops; returns the unsubscribe. */
    function onBeforeLock(flush: () => void) {
        drafts.add(flush)
        return () => drafts.delete(flush)
    }

    /** A vault was created, restored or unlocked: the session is kept as the lock policy says. */
    function open(keep = true) {
        unlocked.value = true
        override.value = 'unlocked'
        const id = opened.value?.vault.id
        if (!id) return
        lastVaultId.value = id
        writeStored(LAST_VAULT_STORAGE_KEY, id)
        if (keep) void kept.keep()
    }

    /** Unwraps the picked vault's key, or the first one's. When this device's slots refuse the password, `copy`
     *  (the vault's Drive copy) is tried: a password changed on another device opens the same key. */
    async function unlock(
        credential: Credential,
        vaultId?: string,
        copy?: VaultFile,
    ): Promise<UnlockResult> {
        // Taken before the PBKDF2, the PIN or the passkey: a lock meanwhile refuses the answer.
        const at = epoch
        const vault = vaultId ? storedVault(vaultId) : files.list.value?.[0]
        if (!vault) {
            // A vault removed meanwhile; only a sample vault takes the demo credentials.
            if (!mocksOn()) return 'unreadable'
            const ok = await demoVerify(credential)
            if (credential.method === 'pin' && vaultId)
                device.demoPin(vaultId, ok)
            return ok ? 'opened' : 'wrong'
        }
        if (credential.method === 'pin') {
            const tried = await tryPin(vault.file, credential.pin)
            await device.refresh([vault.id])
            return typeof tried === 'string'
                ? tried
                : openWith(vault, tried, { at })
        }
        if (credential.method === 'bio') {
            const tried = await passkeySlot(vault.id)
            return typeof tried === 'string'
                ? tried
                : openWith(vault, tried, { at })
        }
        const { password } = credential
        const slot = await passwordSlotOf(vault.file, password)
        if (typeof slot === 'string') return slot
        return openWith(vault, slot, { password, copy, at })
    }

    let loading: Promise<void> | null = null

    /** Loads the vaults on this device, then restores the session kept for them before the guard decides. The kept
     *  entry is watched from here on, locked or not: another page's lock locks this one, its unlock restores here. */
    function load() {
        loading ??= (async () => {
            restoring.value = true
            try {
                await files.load()
                await device.refresh(
                    (files.list.value ?? []).map(({ id }) => id),
                )
                kept.watch(() => void revival.follow())
                await revival.restore()
            } catch (error) {
                // The guard awaits this: a failure here leaves the vaults locked, never the app stuck.
                reportError(error, 'vault-session')
            } finally {
                restoring.value = false
            }
        })()
        return loading
    }

    /** The lock policy changed: the kept session and the PIN slots move to where the new one keeps them, without a
     *  password or a PIN. */
    async function policyChanged(previous: SecuritySettings) {
        const ids = (files.list.value ?? []).map(({ id }) => id)
        await movePlaced(ids, previous, readSecuritySettings())
        await device.refresh(ids)
        if (unlocked.value) await kept.keep()
    }

    interface OpenOptions {
        /** The master password `slot` was made from: the Drive copy's slots are tried with it, and a vault made before
         *  recovery slots gets one. */
        password?: string
        copy?: VaultFile
        /** `slot` is the device slot of a kept session: its ciphertext is already the one to keep. */
        restored?: boolean
        /** The lock epoch the attempt began in. */
        at?: number
    }

    /** Every way in ends here: opens the vault's records with `slot`, moves the secret under the device key once
     *  (`kept.hold`), and stores what an unlock upgrades. */
    async function openWith(
        vault: StoredVault,
        slot: SecretSlot,
        { password, copy, restored, at = epoch }: OpenOptions = {},
    ): Promise<UnlockResult> {
        let used = slot
        let key = await opens(vault.file, slot)
        const viaCopy =
            key === 'wrong' && password !== undefined && copy?.id === vault.id
                ? copy
                : null
        if (viaCopy && password !== undefined) {
            const copied = await passwordSlotOf(viaCopy, password)
            if (typeof copied === 'string') return copied
            used = copied
            key = await opens(viaCopy, copied)
        }
        if (typeof key === 'string') return key
        const unwrapped = key
        const sealed = restored ? slot.sealed : await sealForDevice(used)
        // The key this open installs: a lock or another open since must not arm slots from it.
        let records: VaultKey | undefined
        // In the queue, from the latest file: a write that lands meanwhile is never undone.
        const result = await serial(async () => {
            // Removed meanwhile: opening or upgrading it would bring it back. Opened by another flow, or locked since
            // the answer began: that one stays.
            const latest = storedVault(vault.id)
            if (!latest || unlocked.value || at !== epoch) return 'unreadable'
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
                kept.hold(stored.id, sealed)
                records = next.key
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
        if (
            result === 'opened' &&
            password !== undefined &&
            records &&
            at === epoch
        ) {
            await armAfterPassword(vault.id, records, used).catch((error) =>
                reportError(error, 'vault-session'),
            )
            await device.refresh([vault.id])
        }
        return result
    }

    /** Checks the open vault's master password without touching the session. */
    async function verify(credential: Credential): Promise<boolean> {
        const vault = opened.value?.vault
        if (credential.method !== 'pw') return false
        if (!vault) return mocksOn() && demoVerify(credential)
        return (
            typeof (await opensPassword(vault.file, credential.password)) !==
            'string'
        )
    }

    /** Creates a vault on this device and opens it; `sync` links it to Drive, so its first sync pushes it. */
    async function create(name: string, password: string, sync = false) {
        const { file, key } = await createVault(password)
        const vault = newVault(name, file, sync ? FIRST_PUSH : undefined)
        // `createVault` hands back only the key: the slot the device seal moves the secret from is one more PBKDF2.
        const slot = await passwordSlotOf(file, password)
        const sealed =
            typeof slot === 'string' ? undefined : await sealForDevice(slot)
        await storeOpen({ vault, key, contents: EMPTY_CONTENTS }, sealed)
    }

    const storeOpen = (next: OpenVault, sealed?: Sealed) =>
        persist(next.vault, undefined, () => {
            opened.value = next
            kept.hold(next.vault.id, sealed)
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
        const found = await opensPassword(file, password)
        if (typeof found === 'string') return found
        const { key, slot } = found
        const sealed = await sealForDevice(slot)
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
                await storeOpen({ ...next, vault }, sealed)
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
            // Before the entry goes: its removal would lock this page through the watch, and `active` with it.
            if (active?.vault.id === id) {
                epoch++
                opened.value = null
                recordKeys.clear()
                kept.release()
                unlocked.value = false
                override.value = null
                steamCache
                    .pruneCollections(active.key, () => false)
                    .catch((error) => reportError(error, 'steam-cache'))
            }
            await kept.forget(id)
            device.forget(id)
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

    function changePassword(current: string, next: string): Promise<boolean> {
        const id = opened.value?.vault.id
        if (id === undefined)
            return mocksOn()
                ? demoVerify({ method: 'pw', password: current })
                : Promise.resolve(false)
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
        load,
        policyChanged,
        /** What each vault on this device opens with besides the password (see `DeviceFacts`), by vault id. */
        device: computed(() => device.facts.value),
        refreshDevice: device.refresh,
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
        transact: records.transact,
        replaceRecords: records.replaceRecords,
        snapshot: records.snapshot,
        secretOf: records.secretOf,
        withKey: records.withKey,
        /** A record's held key, reactive; undefined while it is locked. */
        keyOf: recordKeys.get,
        /** Holds a record's own key (a locked account opened) until it is dropped or the vault locks. Take the holder
         *  before the key starts opening: it refuses a key once the record was dropped or the vault locked meanwhile. */
        keyHolder: recordKeys.holder,
        dropKey: recordKeys.drop,
    }
})
