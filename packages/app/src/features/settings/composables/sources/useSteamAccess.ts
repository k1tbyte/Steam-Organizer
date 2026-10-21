import { computed } from 'vue'

import { useMock } from '#core'

import { steamMock } from '../../mocks'
import type { SiteKey } from '../../model'
import { useSettingsStore } from '../../stores/settingsStore'

/** The API key and site grants: what the user changed here over the vault's key and the browser's
 *  grants, which wire in later. */
export function useSteamAccess() {
    const store = useSettingsStore()
    const source = useMock(() => undefined, steamMock)

    const apiKey = computed(() => store.apiKey ?? source.value?.apiKey ?? '')
    // The check result belongs to the key it ran on: an edited key has none yet.
    const keyWorks = computed(
        () =>
            apiKey.value !== '' &&
            apiKey.value === source.value?.apiKey &&
            source.value?.keyWorks === true,
    )
    const firefox = computed(() => source.value?.firefox === true)

    function isAllowed(site: SiteKey): boolean {
        return (
            store.allowedSites.includes(site) ||
            source.value?.grants[site] === true
        )
    }

    return {
        apiKey,
        keyWorks,
        firefox,
        isAllowed,
        setApiKey: store.setApiKey,
        allowSite: store.allowSite,
    }
}
