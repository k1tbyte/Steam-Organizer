import { steamCache } from '@so/core'
import type { AsyncStatus } from '@so/ui'
import {
    computed,
    type MaybeRefOrGetter,
    onScopeDispose,
    shallowRef,
    toValue,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, useMock } from '#core'
import type { Account } from '#features/accounts'
import { useSteamApi } from '#features/steam'
import { useVaultSession } from '#features/vault'

import { libraryMock } from '../../mocks'
import type { ProfileData } from '../../model'
import type { Library } from '../../services/library'

/** The account's games from this device's cache of its last refresh, priced in that refresh's currency.
 *  null when there is none: web never refreshes, and an everything lock keeps them out of the cache. */
export function useLibrary(
    account: MaybeRefOrGetter<Account>,
    details: MaybeRefOrGetter<ProfileData>,
) {
    const { t } = useI18n()
    const session = useVaultSession()
    const reachable = useSteamApi().reachable
    const id = toValue(account).id
    const held = computed(() => session.contents?.data.has(id) ?? false)
    // undefined until the first read; a refresh keeps the shown one until the next lands.
    const read = shallowRef<Library | null>()
    // A refresh writes the snapshot before the cache: the cache's own signal brings the new collection.
    const written = shallowRef(0)
    onScopeDispose(
        steamCache.onCollection((changed) => {
            if (changed === id) written.value++
        }),
    )

    watch(
        [
            () => toValue(account).steam,
            () => toValue(details).stats?.currency,
            written,
        ],
        async ([steam, currency], _, onCleanup) => {
            let gone = false
            onCleanup(() => {
                gone = true
            })
            if (!steam) {
                read.value = null
                return
            }
            // A refresh reads the library of a public profile only; an older public one's cache stays behind.
            if (steam.visibility !== 'public') {
                read.value = { games: null, friends: null }
                return
            }
            try {
                const collection = await session.withKey((key) =>
                    steamCache.collection(key, id),
                )
                const prices = currency
                    ? await steamCache.prices(currency, 0)
                    : new Map<number, number | null>()
                if (gone) return
                read.value = collection && {
                    games:
                        collection.games?.map((game) => ({
                            ...game,
                            price: prices.get(game.appId),
                        })) ?? null,
                    friends: collection.friends,
                }
            } catch (error) {
                reportError(error, 'profile-library')
                if (!gone) read.value = null
            }
        },
        { immediate: true },
    )

    const library = useMock(
        () => (held.value ? (read.value ?? null) : undefined),
        libraryMock,
    )
    return {
        library,
        /** Why there is no cache to show. */
        missing: computed(() =>
            toValue(account).lock?.scope === 'everything'
                ? t(
                      'A fully locked account keeps no games or friends on this device.',
                  )
                : reachable
                  ? t('Refresh the account to see its games and friends.')
                  : t(
                        'Games and friends come with a refresh in the browser extension.',
                    ),
        ),
        /** The tab's status over its own list. */
        statusOf: (list: (found: Library) => readonly unknown[] | null) =>
            computed<AsyncStatus>(() => {
                if (held.value && read.value === undefined) return 'loading'
                const found = library.value
                return found && list(found)?.length ? 'ready' : 'empty'
            }),
    }
}
