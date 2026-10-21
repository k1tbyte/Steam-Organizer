import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { NOTE_MAX_LENGTH } from '../model'

/** Notes edited this session, per account id; saving to the vault is an intent that has no listener yet. */
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
