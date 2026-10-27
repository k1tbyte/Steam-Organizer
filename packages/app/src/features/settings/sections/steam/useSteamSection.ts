import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSteamAccess } from '../../composables/sources/useSteamAccess'
import type { SiteKey } from '../../model'
import { useSteamKeyField } from './useSteamKeyField'

const API_KEY_URL = 'https://steamcommunity.com/dev/apikey'

const SITES: { key: SiteKey; host: string }[] = [
    { key: 'store', host: 'store.steampowered.com' },
    { key: 'community', host: 'steamcommunity.com' },
    { key: 'help', host: 'help.steampowered.com' },
]

export function useSteamSection() {
    const { t } = useI18n()
    const access = useSteamAccess()

    const descriptions = computed<Record<SiteKey, string>>(() => ({
        store: t('Store login and prices'),
        community: t('Profiles, inventory and login'),
        help: t('Login on the help site'),
    }))

    const sites = computed(() =>
        SITES.map(({ key, host }) => ({
            key,
            host,
            description: descriptions.value[key],
            allowed: access.isAllowed(key),
        })),
    )

    return {
        apiKeyUrl: API_KEY_URL,
        apiKey: useSteamKeyField(),
        sites,
        allowSite: access.allowSite,
        showFirefoxNote: access.firefox,
    }
}
