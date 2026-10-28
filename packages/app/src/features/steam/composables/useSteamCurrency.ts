import {
    readSettings,
    SETTINGS_ID,
    type SteamCurrency,
    withSettings,
} from '@so/core'
import { computed } from 'vue'

import { useVaultSession } from '#features/vault'

/** The vault's store currency: prices and library values are in it from the next refresh. */
export function useSteamCurrency() {
    const session = useVaultSession()
    return {
        currency: computed(
            () =>
                readSettings(session.contents?.data.get(SETTINGS_ID)).currency,
        ),
        save: (currency: SteamCurrency) =>
            session.transact(async (contents, key) => [
                await withSettings(
                    key,
                    contents.records.find((found) => found.id === SETTINGS_ID),
                    { currency },
                ),
            ]),
    }
}
