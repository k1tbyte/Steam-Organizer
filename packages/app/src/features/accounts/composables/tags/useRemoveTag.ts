import { computed, ref, shallowRef, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { useUndoDelete } from '#features/vault'

import type { AccountTag } from '../../model'
import { useVaultTags } from './useVaultTags'

/** Deleting a tag: an unused one goes at once, one that accounts wear asks first; either way a toast offers Undo. */
export function useRemoveTag() {
    const { t } = useI18n()
    const undoDelete = useUndoDelete()
    const { counts, remove } = useVaultTags()
    const open = ref(false)
    // Kept after closing, so the dialog fades out with its text.
    const asked = shallowRef<AccountTag>()
    const worn = computed(() =>
        asked.value ? (counts.value.get(asked.value.id) ?? 0) : 0,
    )

    const removeNow = ({ id, label }: AccountTag) =>
        undoDelete({
            remove: () => remove(id),
            title: t('Tag “{label}” deleted', { label }),
            failed: t("Couldn't delete the tag"),
            scope: 'tags',
        })

    return {
        open,
        title: computed(() =>
            t('Delete “{label}”?', { label: asked.value?.label ?? '' }),
        ),
        note: computed(() =>
            worn.value === 1
                ? t(
                      "It's on 1 account. The account stays, only the tag comes off it.",
                  )
                : t(
                      "It's on {count} accounts. The accounts stay, only the tag comes off them.",
                      {
                          count: worn.value,
                      },
                  ),
        ),
        ask(tag: AccountTag) {
            if (!counts.value.get(tag.id)) return void removeNow(tag)
            asked.value = tag
            open.value = true
        },
        confirm() {
            open.value = false
            if (asked.value) void removeNow(asked.value)
        },
    }
}

export type RemoveTagState = UnwrapNestedRefs<ReturnType<typeof useRemoveTag>>
