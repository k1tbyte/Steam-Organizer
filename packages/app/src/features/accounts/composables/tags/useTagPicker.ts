import { computed, type UnwrapNestedRefs } from 'vue'

import type { Account } from '../../model'
import { useVaultAccounts } from '../useVaultAccounts'
import { useTagSearch } from './useTagSearch'

/** One account's tags: a toggle writes at once; a label no tag holds creates it on that account. */
export function useTagPicker(account: () => Account | undefined) {
    const vault = useVaultAccounts()
    const search = useTagSearch()
    const worn = computed(() => new Set(account()?.tags.map((tag) => tag.id)))

    function toggle(id: string) {
        const target = account()
        if (!target) return
        const change = worn.value.has(id) ? { remove: [id] } : { add: [id] }
        void vault.setTags([target.id], change)
    }

    async function create() {
        const target = account()
        const id = await search.create()
        if (id && target) await vault.setTags([target.id], { add: [id] })
    }

    return {
        search,
        rows: computed(() =>
            search.found.value.map((tag) => ({
                ...tag,
                on: worn.value.has(tag.id),
            })),
        ),
        toggle,
        create,
        /** Enter: a new label creates the tag, a known one toggles. */
        submit() {
            const known = search.exact.value
            if (search.fresh.value) void create()
            else if (known) toggle(known.id)
        },
    }
}

export type TagPickerState = UnwrapNestedRefs<ReturnType<typeof useTagPicker>>
