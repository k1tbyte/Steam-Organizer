import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import type { ProfileSection } from '../model'
import { useProfilePrefsStore } from '../stores/profilePrefs'

/** A summary section's folded state, remembered across profiles. */
export function useProfileSection(section: MaybeRefOrGetter<ProfileSection>) {
    const prefs = useProfilePrefsStore()
    return {
        open: computed(() => !prefs.collapsed[toValue(section)]),
        toggle: () => prefs.toggleSection(toValue(section)),
    }
}
