import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { NOTE_MAX_LENGTH } from '../model'

/** Notes typed this session, per account id: the field shows them at once, the vault gets them after a pause. */
export const useProfileNotesStore = defineStore('profile-notes', () => {
    const edited = ref<Record<string, string>>({})

    return {
        edited: computed(() => edited.value),
        set(id: string, text: string) {
            edited.value = {
                ...edited.value,
                [id]: text.slice(0, NOTE_MAX_LENGTH),
            }
        },
    }
})
