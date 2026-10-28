import { STEAM_CURRENCIES, type SteamCurrency } from '@so/core'
import type { ToggleOption } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useSteamCurrency } from '#features/steam'

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
    const { t, locale } = useI18n()
    const access = useSteamAccess()
    const steamCurrency = useSteamCurrency()

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

    const currencies = computed<ToggleOption<SteamCurrency>[]>(() => {
        const names = new Intl.DisplayNames(locale.value, { type: 'currency' })
        return (Object.keys(STEAM_CURRENCIES) as SteamCurrency[]).map(
            (code) => ({ value: code, label: `${code} · ${names.of(code)}` }),
        )
    })

    return {
        apiKeyUrl: API_KEY_URL,
        currencies,
        currency: steamCurrency.currency,
        setCurrency: (currency: SteamCurrency) =>
            steamCurrency
                .save(currency)
                .catch((error) => reportError(error, 'steam-currency')),
        apiKey: useSteamKeyField(),
        sites,
        allowSite: access.allowSite,
        showFirefoxNote: access.firefox,
    }
}
