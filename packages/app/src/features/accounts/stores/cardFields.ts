import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
    ACCOUNTS_CARD_FIELDS_STORAGE_KEY,
    readStored,
    writeStored,
} from '#core'

import type { CardFlags } from '../model'
import { DEFAULT_CARD_FLAGS, parseCardFlags } from '../services/storedState'

/** Which fields every account card shows, remembered across reloads. */
export const useCardFieldsStore = defineStore('accounts-card-fields', () => {
    const state = ref<CardFlags>(
        parseCardFlags(readStored(ACCOUNTS_CARD_FIELDS_STORAGE_KEY)),
    )

    // Saved by each action: a watcher made in the first caller's setup would keep that page alive.
    const save = () =>
        writeStored(
            ACCOUNTS_CARD_FIELDS_STORAGE_KEY,
            JSON.stringify(state.value),
        )

    return {
        flags: computed(() => state.value),
        toggle(key: keyof CardFlags) {
            state.value[key] = !state.value[key]
            save()
        },
        reset() {
            state.value = { ...DEFAULT_CARD_FLAGS }
            save()
        },
    }
})
