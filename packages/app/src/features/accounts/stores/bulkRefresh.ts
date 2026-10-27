import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { useVaultSession } from '#features/vault'

import { useSteamRefresh } from '../composables/refresh/useSteamRefresh'

// Each batch is one vault write; a smaller one moves the progress and a Stop sooner.
const BATCH = 25
const FRESH_MS = 60 * 60 * 1000

export interface RefreshRun {
    /** 0 until the accounts to refresh are known. */
    total: number
    done: number
    stopping: boolean
}

export interface RefreshResult {
    updated: number
    /** Refreshed within the hour, so skipped. */
    fresh: number
    /** Steam has no profile for them now. */
    missing: number
    /** Not reached: the run was stopped, or `error` ended it. */
    left: string[]
    error?: unknown
}

/** A refresh of many accounts: outlives the page that started it, which only shows it. */
export const useBulkRefreshStore = defineStore('bulkRefresh', () => {
    const session = useVaultSession()
    const steam = useSteamRefresh()
    const run = shallowRef<RefreshRun | null>(null)

    /** Resolves to null while another run is on, or once a vault lock ended this one. */
    async function start(
        ids: readonly string[],
        skipFresh: boolean,
    ): Promise<RefreshResult | null> {
        if (run.value) return null
        let locked = false
        const unsubscribe = session.onBeforeLock(() => {
            locked = true
        })
        run.value = { total: 0, done: 0, stopping: false }
        try {
            const since = Date.now() - FRESH_MS
            const found = await steam.targets(ids)
            const queue = found
                .filter(
                    (target) => !skipFresh || (target.refreshedAt ?? 0) < since,
                )
                .map((target) => target.id)
            const result: RefreshResult = {
                updated: 0,
                fresh: found.length - queue.length,
                missing: 0,
                left: [],
            }
            for (let at = 0; at < queue.length; at += BATCH) {
                if (locked) return null
                if (run.value?.stopping)
                    return { ...result, left: queue.slice(at) }
                run.value = { total: queue.length, done: at, stopping: false }
                const batch = queue.slice(at, at + BATCH)
                try {
                    const { updated, missing } = await steam.refresh(batch)
                    result.updated += updated
                    result.missing += missing.length
                } catch (error) {
                    return locked
                        ? null
                        : { ...result, left: queue.slice(at), error }
                }
            }
            return locked ? null : result
        } finally {
            unsubscribe()
            run.value = null
        }
    }

    return {
        run: computed(() => run.value),
        start,
        /** Ends the run once the batch in flight lands. */
        stop() {
            if (run.value) run.value = { ...run.value, stopping: true }
        },
    }
})
