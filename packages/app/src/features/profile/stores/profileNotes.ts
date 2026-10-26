import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { NOTE_MAX_LENGTH } from '../model'

/** Notes typed this session, per account id: the field shows them at once, the vault gets them after a pause.
 *  `failed` keeps those whose last save failed, so a reopened profile still offers Retry. */
export const useProfileNotesStore = defineStore('profile-notes', () => {
    const edited = ref<Record<string, string>>({})
    const failed = ref<ReadonlySet<string>>(new Set())

    return {
        edited: computed(() => edited.value),
        failed: computed(() => failed.value),
        settle(id: string, saved: boolean) {
            if (failed.value.has(id) !== saved) return
            const next = new Set(failed.value)
            if (saved) next.delete(id)
            else next.add(id)
            failed.value = next
        },
        set(id: string, text: string) {
            edited.value = {
                ...edited.value,
                [id]: text.slice(0, NOTE_MAX_LENGTH),
            }
        },
    }
})
