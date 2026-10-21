import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

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

    watch(
        state,
        (flags) =>
            writeStored(
                ACCOUNTS_CARD_FIELDS_STORAGE_KEY,
                JSON.stringify(flags),
            ),
        { deep: true },
    )

    return {
        flags: computed(() => state.value),
        toggle(key: keyof CardFlags) {
            state.value[key] = !state.value[key]
        },
        reset() {
            state.value = { ...DEFAULT_CARD_FLAGS }
        },
    }
})
