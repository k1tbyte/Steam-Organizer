import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { TagMatch } from '../../model'
import { withLiveTags } from '../../services/filters'
import { useAccountsViewStore } from '../../stores/accountsView'
import { useVaultTags } from './useVaultTags'

/** The list's tag filter: the tags it asks for, each with how many accounts wear it, and whether an account needs any or all of them. */
export function useTagFilter() {
    const { t } = useI18n()
    const store = useAccountsViewStore()
    const { view } = storeToRefs(store)
    const { tags, counts } = useVaultTags()
    const picked = computed(() => withLiveTags(view.value, tags.value).tags)

    return {
        count: computed(() => picked.value.length),
        match: computed(() => view.value.tagMatch),
        matchItems: computed<{ value: TagMatch; label: string }[]>(() => [
            { value: 'any', label: t('Any') },
            { value: 'all', label: t('All') },
        ]),
        setMatch: store.setTagMatch,
        rows: computed(() =>
            tags.value.map((tag) => ({
                ...tag,
                on: picked.value.includes(tag.id),
                count: counts.value.get(tag.id) ?? 0,
            })),
        ),
        toggle: store.toggleTag,
        clear: store.clearTags,
    }
}
