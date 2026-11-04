import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { NOTIFICATIONS_STORAGE_KEY, readStored, writeStored } from '#core'
import { useVaultSession } from '#features/vault'

import type { LoggedNotification, NotificationEvent } from '../model'
import {
    holds,
    type NotificationLogs,
    readLogs,
    withEvent,
} from '../services/notificationLog'

export interface PushOptions {
    /** Where a click on it goes. */
    route?: string
    /** Skip it when the log already holds the same event (an update found again after a reload). */
    once?: boolean
}

/** Each vault's notification log on this device: the latest 50, each read or not. */
export const useNotificationLog = defineStore('notificationLog', () => {
    const session = useVaultSession()
    let seen = readStored(NOTIFICATIONS_STORAGE_KEY)
    const logs = shallowRef<NotificationLogs>(readLogs(seen))

    // Read again before each write, so another tab's entries stay; denied storage keeps the log in memory.
    function change(
        vaultId: string,
        next: (log: LoggedNotification[]) => LoggedNotification[],
    ) {
        const stored = readStored(NOTIFICATIONS_STORAGE_KEY)
        // Storage unchanged since the last change means no page wrote: memory holds what a failed write did not save.
        const all =
            stored === null || stored === seen ? logs.value : readLogs(stored)
        seen = stored
        logs.value = { ...all, [vaultId]: next(all[vaultId] ?? []) }
        writeStored(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(logs.value))
    }

    function changeOpen(
        next: (log: LoggedNotification[]) => LoggedNotification[],
    ) {
        const vaultId = session.vault?.id
        if (vaultId) change(vaultId, next)
    }

    return {
        /** The open vault's log, newest first; null while no vault is open. */
        entries: computed(() => {
            const vaultId = session.vault?.id
            return vaultId ? (logs.value[vaultId] ?? []) : null
        }),
        /** Logs an event for the vault the work was done for, which may have closed since. */
        push(
            vaultId: string,
            event: NotificationEvent,
            options: PushOptions = {},
        ) {
            change(vaultId, (log) =>
                options.once && holds(log, event)
                    ? log
                    : withEvent(log, event, {
                          id: crypto.randomUUID(),
                          at: Date.now(),
                          route: options.route,
                      }),
            )
        },
        markRead(id: string) {
            changeOpen((log) =>
                log.map((entry) =>
                    entry.id === id ? { ...entry, read: true } : entry,
                ),
            )
        },
        markAllRead() {
            changeOpen((log) => log.map((entry) => ({ ...entry, read: true })))
        },
    }
})
