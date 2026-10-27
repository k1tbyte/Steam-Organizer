import { computed } from 'vue'

import { useMock } from '#core'

import { steamMock } from '../../mocks'
import type { SiteKey } from '../../model'
import { useSettingsStore } from '../../stores/settingsStore'

/** Site grants: what the user allowed here over the browser's grants, which wire in later. */
export function useSteamAccess() {
    const store = useSettingsStore()
    const source = useMock(() => undefined, steamMock)

    const firefox = computed(() => source.value?.firefox === true)

    function isAllowed(site: SiteKey): boolean {
        return (
            store.allowedSites.includes(site) ||
            source.value?.grants[site] === true
        )
    }

    return {
        firefox,
        isAllowed,
        allowSite: store.allowSite,
    }
}
