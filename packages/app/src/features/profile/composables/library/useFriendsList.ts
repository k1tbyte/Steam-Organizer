import { type SteamFriend, toAccountId } from '@so/core'
import type { MenuGroup } from '@so/ui'
import { computed, type Ref, ref, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import { useVaultAccounts } from '#features/accounts'

import {
    type FriendFilter,
    type FriendSort,
    type Library,
    listFriends,
} from '../../services/library'
import { steamLinkUrl } from '../../services/steamLinks'

/** The Friends tab: search, All / In vault, the newest friendship or names first, and each card's display. */
export function useFriendsList(
    library: Ref<Library | null | undefined>,
    missing: Ref<string>,
) {
    const { t, locale } = useI18n()
    const { accounts } = useVaultAccounts()
    const query = ref('')
    const filter = ref<FriendFilter>('all')
    const sort = ref<FriendSort>('since')

    // Account IDs the vault holds, to the record id their profile opens by.
    const vaultIds = computed(
        () =>
            new Map(
                accounts.value.flatMap((account) =>
                    account.steamId ? [[account.steamId, account.id]] : [],
                ),
            ),
    )
    const vaultIdOf = (steamId: string) =>
        vaultIds.value.get(toAccountId(steamId))

    const owned = computed(() => library.value?.friends ?? [])
    const friends = computed(() =>
        listFriends(owned.value, query.value, filter.value, sort.value, (id) =>
            vaultIds.value.has(toAccountId(id)),
        ),
    )
    const labels = computed<Record<FriendSort, string>>(() => ({
        since: t('Friends since'),
        name: t('Name'),
    }))
    const month = computed(
        () =>
            new Intl.DateTimeFormat(locale.value, {
                month: 'short',
                year: 'numeric',
            }),
    )

    return {
        query,
        filter,
        filters: computed(() =>
            (
                [
                    ['all', t('All')],
                    ['vault', t('In vault')],
                ] as const
            ).map(([value, label]) => ({
                value,
                label,
                on: filter.value === value,
            })),
        ),
        friends,
        /** Rows of `columns` friends each, for a grid that windows by rows. */
        rows: (columns: number) => {
            const rows: SteamFriend[][] = []
            for (let start = 0; start < friends.value.length; start += columns)
                rows.push(friends.value.slice(start, start + columns))
            return rows
        },
        noMatch: computed(
            () => owned.value.length > 0 && friends.value.length === 0,
        ),
        sortLabel: computed(() => labels.value[sort.value]),
        sortItems: computed<MenuGroup[]>(() => [
            {
                choice: 'list',
                value: sort.value,
                items: (['since', 'name'] as const).map((key) => ({
                    key,
                    label: labels.value[key],
                    onSelect: () => {
                        sort.value = key
                    },
                })),
            },
        ]),
        cycleSort: () => {
            sort.value = sort.value === 'since' ? 'name' : 'since'
        },
        empty: computed(() => {
            const found = library.value?.friends
            if (found)
                return {
                    title: t('No friends'),
                    description: t('This account has no Steam friends yet.'),
                }
            if (found === null)
                return {
                    title: t('Friends hidden'),
                    description: t(
                        "This profile's friend list is private on Steam.",
                    ),
                }
            return { title: t('Friends'), description: missing.value }
        }),
        /** What one card shows; called only for the cards on screen. */
        cardOf(friend: SteamFriend) {
            const accountId = toAccountId(friend.steamId)
            const vaultId = vaultIdOf(friend.steamId)
            return {
                name: friend.nickname || accountId,
                hue: Number((BigInt(friend.steamId) * 47n) % 360n),
                avatar: friend.avatar,
                since:
                    friend.since === null
                        ? ''
                        : t('Friends since {date}', {
                              date: month.value.format(friend.since),
                          }),
                profile: steamLinkUrl('profile', accountId),
                vaultPath: vaultId && `/accounts/${vaultId}`,
            }
        },
    }
}

/** The list as the tab hands it to its cards: refs unwrapped by `reactive`. */
export type FriendsListState = UnwrapNestedRefs<
    ReturnType<typeof useFriendsList>
>
