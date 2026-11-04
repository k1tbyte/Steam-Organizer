import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
    type Look,
    PRESET_FOLLOW_STORAGE_KEY,
    parseLook,
    parseRecord,
    readStored,
    writeStored,
} from '#core'

/** The preset this device follows, and the look and picture it put on: wearing them still is following. */
export interface Follow {
    vaultId: string
    presetId: string
    look: Look
    picture: string | null
}

function readFollow(): Follow | null {
    const { vaultId, presetId, look, picture } = parseRecord(
        readStored(PRESET_FOLLOW_STORAGE_KEY),
    )
    if (typeof vaultId !== 'string' || typeof presetId !== 'string') return null
    return {
        vaultId,
        presetId,
        look: parseLook(look),
        picture: typeof picture === 'string' ? picture : null,
    }
}

/** One per device: the vault opened last names it, another vault follows nothing. */
export const usePresetFollow = defineStore('preset-follow', () => {
    const follow = ref(readFollow())

    function set(next: Follow) {
        follow.value = next
        writeStored(PRESET_FOLLOW_STORAGE_KEY, JSON.stringify(next))
    }

    return { follow: computed(() => follow.value), set }
})
