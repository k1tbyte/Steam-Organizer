import { useToast } from '@so/ui'
import { computed, ref, shallowRef, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useVaultSession } from '#features/vault'

import type { AccountTag } from '../../model'
import { UNDO_MS } from '../useRemoveAccounts'
import { useVaultTags } from './useVaultTags'

/** Deleting a tag: an unused one goes at once, one that accounts wear asks first; either way a toast offers Undo. */
export function useRemoveTag() {
    const { t } = useI18n()
    const toast = useToast()
    const session = useVaultSession()
    const { counts, remove } = useVaultTags()
    const open = ref(false)
    // Kept after closing, so the dialog fades out with its text.
    const asked = shallowRef<AccountTag>()
    const worn = computed(() =>
        asked.value ? (counts.value.get(asked.value.id) ?? 0) : 0,
    )

    async function removeNow({ id, label }: AccountTag) {
        let undo: () => Promise<void>
        try {
            undo = await remove(id)
        } catch (error) {
            reportError(error, 'tags')
            toast.add({ color: 'danger', title: t("Couldn't delete the tag") })
            return
        }
        // A lock clears the toasts; a write that lands after it must not bring one back.
        if (session.state !== 'unlocked') return
        toast.add({
            title: t('Tag “{label}” deleted', { label }),
            description: (seconds) => t('Undo for {seconds} s', { seconds }),
            icon: 'icon-[lucide--trash-2]',
            duration: UNDO_MS,
            progress: true,
            action: {
                label: t('Undo'),
                onClick: () =>
                    void undo().catch((error) => {
                        reportError(error, 'tags')
                        toast.add({
                            color: 'danger',
                            title: t("Couldn't restore"),
                        })
                    }),
            },
        })
    }

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
