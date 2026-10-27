import type { SteamIdDisplayFormat } from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
    PROFILE_ID_FORMAT_STORAGE_KEY,
    PROFILE_SECTIONS_STORAGE_KEY,
    readStored,
    writeStored,
} from '#core'

import type { ProfileSection } from '../model'
import { parseCollapsedSections, parseIdFormat } from '../services/storedPrefs'

/** What every profile remembers: the Steam ID format and which sections are folded. */
export const useProfilePrefsStore = defineStore('profile-prefs', () => {
    const idFormat = ref(
        parseIdFormat(readStored(PROFILE_ID_FORMAT_STORAGE_KEY)),
    )
    const collapsed = ref(
        parseCollapsedSections(readStored(PROFILE_SECTIONS_STORAGE_KEY)),
    )

    // Saved by its action: a watcher made in the first caller's setup would keep that page alive.

    return {
        idFormat: computed(() => idFormat.value),
        collapsed: computed(() => collapsed.value),
        setIdFormat(format: SteamIdDisplayFormat) {
            idFormat.value = format
            writeStored(PROFILE_ID_FORMAT_STORAGE_KEY, format)
        },
        toggleSection(section: ProfileSection) {
            collapsed.value[section] = !collapsed.value[section]
            writeStored(
                PROFILE_SECTIONS_STORAGE_KEY,
                JSON.stringify(collapsed.value),
            )
        },
    }
})
