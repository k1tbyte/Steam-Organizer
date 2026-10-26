import {
    type LiveRecord,
    RECORD,
    readTag,
    sealRecord,
    type TagData,
    updateData,
} from '@so/core'
import { computed } from 'vue'

import type { VaultContents } from '#features/vault'

import { findTag, tagCounts, tagLabel } from '../../services/tags'
import { tagsIn } from '../../services/vaultAccounts'
import { useAccountsSource } from '../useAccountsSource'

function liveTag(contents: VaultContents, id: string) {
    const record = contents.records.find((r) => r.id === id)
    const tag = readTag(contents.data.get(id))
    return record && !('deleted' in record) && tag ? { record, tag } : null
}

/** The vault's tags with how many accounts wear each, and the one writer of TAG records. Labels are unique ignoring case. */
export function useVaultTags() {
    const { session, sample, onVault } = useAccountsSource()

    /** Resolves to the new tag's id, or to the one already holding the label. */
    async function create(text: string, hue: number): Promise<string | null> {
        const label = tagLabel(text)
        if (!onVault.value || label === '') return null
        let id: string | null = null
        await session.transact(async (contents, key) => {
            id = findTag(tagsIn(contents.data), label)?.id ?? null
            if (id) return []
            id = crypto.randomUUID()
            const data: TagData = { kind: RECORD.TAG, label, hue }
            return [await sealRecord(key, { id, updatedAt: Date.now(), data })]
        })
        return id
    }

    /** False when another tag holds the label. */
    async function update(
        id: string,
        patch: { label?: string; hue?: number },
    ): Promise<boolean> {
        if (!onVault.value) return true
        const label = patch.label === undefined ? '' : tagLabel(patch.label)
        let saved = true
        await session.transact(async (contents, key) => {
            const live = liveTag(contents, id)
            if (!live) return []
            const holder = label && findTag(tagsIn(contents.data), label)
            saved = !holder || holder.id === id
            if (!saved) return []
            const next: TagData = {
                ...live.tag,
                ...(label && { label }),
                ...(patch.hue !== undefined && { hue: patch.hue }),
            }
            return [await updateData(key, live.record, next, Date.now())]
        })
        return saved
    }

    /** Tombstones the tag alone: accounts keep its id, which shows nothing and drops on their next tag change, so Undo puts it back on them. */
    async function remove(id: string): Promise<() => Promise<void>> {
        if (!onVault.value) return async () => {}
        let taken: LiveRecord | undefined
        let label = ''
        await session.transact(async (contents) => {
            const live = liveTag(contents, id)
            if (!live) return []
            taken = live.record
            label = live.tag.label
            return [{ id, updatedAt: Date.now(), deleted: true as const }]
        })
        // The same sealed record, newer than its tombstone; a tag that took its label meanwhile keeps it.
        return () =>
            session.transact(async (contents) => {
                if (!taken || findTag(tagsIn(contents.data), label)) return []
                return [{ ...taken, updatedAt: Date.now() }]
            })
    }

    return {
        tags: computed(() => sample.value?.tags ?? []),
        counts: computed(() => tagCounts(sample.value?.accounts ?? [])),
        create,
        update,
        remove,
    }
}
