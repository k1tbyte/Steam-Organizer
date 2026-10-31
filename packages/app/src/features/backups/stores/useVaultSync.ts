import {
    type DriveApi,
    DriveError,
    listBackups,
    listCopies,
    readCopy,
    saveBackup,
    saveCopy,
    type VaultCopy,
    type VaultSync,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import {
    readStored,
    reportError,
    SYNC_SETTINGS_STORAGE_KEY,
    writeStored,
} from '#core'
import { useDrive } from '#features/drive'
import {
    type LockedSnapshot,
    type MergedCopy,
    tally,
    useVaultSession,
} from '#features/vault'

import {
    SYNC_DEFAULTS,
    SYNC_INTERVALS,
    type SyncNotice,
    type SyncSettings,
} from '../model'
import { autoBackupDue, prunedAutoBackups } from '../services/autoBackup'
import { useBackupList } from './useBackupList'

function storedSettings(): SyncSettings {
    try {
        const saved = JSON.parse(
            readStored(SYNC_SETTINGS_STORAGE_KEY) || '{}',
        ) as Partial<SyncSettings>
        const flag = (value: unknown, fallback: boolean) =>
            typeof value === 'boolean' ? value : fallback
        return {
            autoSync: flag(saved.autoSync, SYNC_DEFAULTS.autoSync),
            interval: SYNC_INTERVALS.find((value) => value === saved.interval)
                ? (saved.interval as SyncSettings['interval'])
                : SYNC_DEFAULTS.interval,
            autoBackup: flag(saved.autoBackup, SYNC_DEFAULTS.autoBackup),
        }
    } catch {
        return SYNC_DEFAULTS
    }
}

/** The vault a run syncs, with the link it read and the scope it runs for. */
interface Exchange {
    id: string
    name: string
    link: VaultSync
    email: string
    /** `useBackupList().scope` at the start: a run for another vault or account stops. */
    at: string
}

// A file already gone is what a delete wanted.
const goneIsDone = (error: unknown) => {
    if (!(error instanceof DriveError && error.kind === 'not-found'))
        throw error
}

/** Syncs the open vault with its Drive copy: list, merge, push, then record the version left. One run at a time;
 *  results for another vault or Google account never land. Holds the device's sync settings. */
export const useVaultSync = defineStore('vault-sync', () => {
    const session = useVaultSession()
    const drive = useDrive()
    const backups = useBackupList()
    const settings = ref(storedSettings())
    const running = ref(false)
    const failed = shallowRef<{ at: string; error: unknown } | null>(null)
    const listeners = new Set<(notice: SyncNotice) => void>()
    let flight: Promise<void> | null = null
    let again = false
    let checking: Promise<void> | null = null
    // Syncs and lock pushes take turns: an upload finishing late never lands over a newer one.
    let lane: Promise<unknown> = Promise.resolve()
    function inLane<T>(task: () => Promise<T>): Promise<T> {
        const turn = lane.then(task)
        lane = turn.catch(() => {})
        return turn
    }

    const failure = computed(() =>
        failed.value && failed.value.at === backups.scope
            ? failed.value.error
            : null,
    )

    function notify(notice: SyncNotice) {
        for (const listener of listeners) listener(notice)
    }

    // Another Google account, a reset elsewhere or app data removed from Drive: the vault stays here, nothing is recreated.
    async function gone(vault: { id: string; name: string }) {
        await session.unlink(vault.id)
        notify({ kind: 'gone', vaultName: vault.name })
    }

    async function run() {
        const open = session.vault
        const link =
            open && session.vaults.find(({ id }) => id === open.id)?.sync
        const email = drive.account.value?.email
        const at = backups.scope
        if (!open || !link || !email || !at) return
        if (drive.state.value !== 'connected') return
        const vault = { id: open.id, name: open.name, link, email, at }
        if (link.account !== null && link.account !== email) return gone(vault)
        running.value = true
        try {
            await drive.run((api) => exchange(api, vault))
            if (failed.value?.at === at) failed.value = null
        } catch (error) {
            if (backups.scope !== at) return
            // A copy that can't be read (newer, damaged, another key) is never written over.
            if (!(error instanceof DriveError))
                reportError(error, 'sync', { vault: open.id })
            const streak = failed.value?.at === at
            failed.value = { at, error }
            if (!streak) notify({ kind: 'failed' })
        } finally {
            running.value = false
        }
    }

    async function exchange(api: DriveApi, vault: Exchange) {
        const { email, at } = vault
        const stale = () => backups.scope !== at
        const copies = await listCopies(api, vault.id)
        if (stale()) return
        const [kept, ...extras] = copies
        if (!kept && vault.link.copyId !== null) return gone(vault)
        const mark = (merged: MergedCopy, copy: VaultCopy) =>
            session.markSynced(merged.receipt, {
                account: email,
                copyId: copy.id,
                version: copy.version,
            })

        async function push(merged: MergedCopy) {
            const saved = await saveCopy(
                api,
                merged.file,
                {
                    vaultName: session.vault?.name ?? vault.name,
                    accounts: tally(session.contents).accounts,
                },
                kept?.id,
            )
            if (stale()) return
            await mark(merged, saved)
            for (const extra of extras)
                await api.remove(extra.id).catch(goneIsDone)
        }

        // Drive's copy is the one merged last: only this device's changes may be missing there.
        const unchanged =
            kept?.id === vault.link.copyId &&
            kept.version === vault.link.version &&
            extras.length === 0
        if (!kept || unchanged) {
            const local = await session.mergeCopy(null)
            if (!local || stale()) return
            if (kept && !local.push) return void (await mark(local, kept))
            return push(local)
        }
        // Two first pushes crossed: each copy merges in, the oldest last, since it is the one kept.
        let merged: MergedCopy | undefined
        for (const copy of [...extras, kept]) {
            const file = await readCopy(api, copy.id)
            if (stale()) return
            merged = await session.mergeCopy(file)
            if (!merged || stale()) return
        }
        if (!merged) return
        if (merged.push || extras.length) await push(merged)
        else await mark(merged, kept)
    }

    /** Syncs now; a call while one runs runs it once more after. */
    function sync(): Promise<void> {
        if (flight) {
            again = true
            return flight
        }
        flight = (async () => {
            try {
                do {
                    again = false
                    await inLane(run)
                } while (again)
            } finally {
                flight = null
            }
        })()
        return flight
    }

    /** Pushes the file a lock left, without its key, only over the copy it was merged with; else it waits for the next unlock. */
    function flush(pending: Promise<LockedSnapshot | undefined>) {
        return inLane(() => pushLocked(pending))
    }

    async function pushLocked(pending: Promise<LockedSnapshot | undefined>) {
        const snapshot = await pending.catch(() => undefined)
        const email = drive.account.value?.email
        if (!snapshot || !email || drive.state.value !== 'connected') return
        const { file, receipt, accounts } = snapshot
        const { link } = receipt
        if (link.copyId === null || link.account !== email) return
        try {
            await drive.run(async (api) => {
                const copies = await listCopies(api, receipt.vaultId)
                const [kept] = copies
                if (copies.length !== 1 || kept?.id !== link.copyId) return
                if (kept.version !== link.version) return
                const vaultName =
                    session.vaults.find(({ id }) => id === receipt.vaultId)
                        ?.name ?? kept.vaultName
                const saved = await saveCopy(
                    api,
                    file,
                    { vaultName, accounts },
                    kept.id,
                )
                await session.markSynced(receipt, {
                    account: email,
                    copyId: saved.id,
                    version: saved.version,
                })
            })
        } catch (error) {
            if (!(error instanceof DriveError)) reportError(error, 'sync')
        }
    }

    async function backUp() {
        const vault = session.vault
        const at = backups.scope
        if (!settings.value.autoBackup || !vault?.sync || !at) return
        if (drive.state.value !== 'connected') return
        try {
            await drive.run(async (api) => {
                const found = await listBackups(api, vault.id)
                if (backups.scope !== at || !session.contents) return
                const records = session.contents.records
                let all = found
                if (autoBackupDue(found, records, Date.now())) {
                    const snapshot = await session.snapshot()
                    if (backups.scope !== at || snapshot?.file.id !== vault.id)
                        return
                    const saved = await saveBackup(api, snapshot.file, {
                        vaultName: vault.name,
                        kind: 'auto',
                        accounts: tally(snapshot.contents).accounts,
                    })
                    backups.added(at, saved)
                    all = [saved, ...found]
                }
                const pruned = prunedAutoBackups(all)
                for (const old of pruned)
                    await api.remove(old.id).catch(goneIsDone)
                if (pruned.length && backups.list) await backups.load()
            })
        } catch (error) {
            if (!(error instanceof DriveError)) reportError(error, 'backups')
        }
    }

    return {
        settings: computed(() => settings.value),
        setSettings(patch: Partial<SyncSettings>) {
            settings.value = { ...settings.value, ...patch }
            writeStored(
                SYNC_SETTINGS_STORAGE_KEY,
                JSON.stringify(settings.value),
            )
        },
        /** A sync is talking to Drive. */
        running: computed(() => running.value),
        /** Why the last sync of this vault and account failed; null after a good one. */
        failure,
        sync,
        /** Sync from the user: its failure speaks even inside a streak. */
        syncNow() {
            if (failed.value?.at === backups.scope) failed.value = null
            return sync()
        },
        flush,
        /** Saves an auto backup when one is due, then keeps the newest ten. */
        backUpIfDue() {
            checking ??= backUp().finally(() => {
                checking = null
            })
            return checking
        },
        /** Hears what the screens should say (the copy left Drive, a failure); returns the unsubscribe. */
        onNotice(listener: (notice: SyncNotice) => void) {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
    }
})
