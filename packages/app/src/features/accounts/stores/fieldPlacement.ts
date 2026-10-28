import {
    type FieldDefaults,
    MOVABLE_FIELDS,
    type MovableField,
    readSettings,
    SETTINGS_ID,
    type SettingsData,
    withSettings,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

import { useVaultSession } from '#features/vault'

import { placedRecord } from '../services/placedRecord'
import { storedAccounts } from '../services/vaultAccounts'

// Each batch rewrites the whole vault file: fewer, larger batches.
const BATCH = 100

export interface PlacementRun {
    fields: MovableField[]
    done: number
    total: number
}

const keepOpen = (event: BeforeUnloadEvent) => event.preventDefault()

/** A placement change moving fields in every account: outlives the Settings window, which only shows it. */
export const useFieldPlacementStore = defineStore('fieldPlacement', () => {
    const session = useVaultSession()
    const run = shallowRef<PlacementRun | null>(null)
    const finished = shallowRef<number | null>(null)

    /** Resolves to the accounts the vault holds as the record lands: writes queued before it are in. */
    async function writeSettings(patch: Partial<SettingsData>) {
        let ids: string[] = []
        await session.transact(async (contents, key) => {
            ids = storedAccounts(contents.data).map(({ id }) => id)
            const record = contents.records.find(
                (found) => found.id === SETTINGS_ID,
            )
            return [await withSettings(key, record, patch)]
        })
        return ids
    }

    function moveBatch(ids: readonly string[]) {
        return session.transact(async (contents, key) => {
            const records = new Map(
                contents.records.map((record) => [record.id, record]),
            )
            const moved = []
            for (const id of ids) {
                const record = records.get(id)
                if (!record || 'deleted' in record) continue
                const placed = await placedRecord(key, contents, record)
                if (placed) moved.push(placed)
            }
            return moved
        })
    }

    /** Saves the placement, then moves the fields of every account; `moving` marks the record until the last one.
     *  A lock stops it there: the mark stays, and Settings offers to finish. */
    async function apply(target: FieldDefaults) {
        const contents = session.contents
        if (!contents || run.value) return
        const before = readSettings(
            contents.data.get(SETTINGS_ID),
        ).fieldDefaults
        const fields = MOVABLE_FIELDS.filter(
            (field) => before[field] !== target[field],
        )
        let locked = false
        const unsubscribe = session.onBeforeLock(() => {
            locked = true
        })
        finished.value = null
        run.value = { fields, done: 0, total: 0 }
        // Unit tests run with no window.
        globalThis.addEventListener?.('beforeunload', keepOpen)
        try {
            const ids = await writeSettings({
                fieldDefaults: target,
                moving: true,
            })
            for (let at = 0; at < ids.length && !locked; at += BATCH) {
                run.value = { fields, done: at, total: ids.length }
                await moveBatch(ids.slice(at, at + BATCH))
            }
            if (locked) return
            await writeSettings({ moving: false })
            finished.value = ids.length
        } finally {
            unsubscribe()
            globalThis.removeEventListener?.('beforeunload', keepOpen)
            run.value = null
        }
    }

    return {
        run: computed(() => run.value),
        finished: computed(() => finished.value),
        apply,
        dismiss() {
            finished.value = null
        },
    }
})
