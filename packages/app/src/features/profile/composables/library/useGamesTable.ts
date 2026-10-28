import {
    computed,
    type MaybeRefOrGetter,
    type Ref,
    ref,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProfileData } from '../../model'
import {
    FIRST_DIR,
    type GameFilter,
    type GameOrder,
    type GameSort,
    type Library,
    type LibraryGame,
    listGames,
} from '../../services/library'

const CAPSULES =
    'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps'

/** The Games tab: search, Played / Unplayed, sorting by a column (a cycling button on phones) and each row's display. */
export function useGamesTable(
    details: MaybeRefOrGetter<ProfileData>,
    library: Ref<Library | null | undefined>,
    missing: Ref<string>,
) {
    const { t, locale } = useI18n()
    const query = ref('')
    const filter = ref<GameFilter>('all')
    const order = ref<GameOrder>({ by: 'playtime', dir: -1 })

    const owned = computed(() => library.value?.games ?? [])
    const games = computed(() =>
        listGames(owned.value, query.value, filter.value, order.value),
    )
    const mostMinutes = computed(() =>
        owned.value.reduce((most, game) => Math.max(most, game.minutes), 1),
    )

    const labels = computed<Record<GameSort, string>>(() => ({
        name: t('Game'),
        playtime: t('Playtime'),
        recent: t('Past 2 weeks'),
        price: t('Price'),
    }))
    const sortBy = (by: GameSort) => {
        const { by: current, dir } = order.value
        order.value = {
            by,
            dir: by === current ? (-dir as 1 | -1) : FIRST_DIR[by],
        }
    }
    const cycle: GameSort[] = ['playtime', 'recent', 'name', 'price']

    const formats = computed(() => {
        const { stats } = toValue(details)
        return {
            whole: new Intl.NumberFormat(locale.value, {
                maximumFractionDigits: 0,
            }),
            tenths: new Intl.NumberFormat(locale.value, {
                maximumFractionDigits: 1,
            }),
            money:
                stats &&
                new Intl.NumberFormat(locale.value, {
                    style: 'currency',
                    currency: stats.currency,
                }),
        }
    })
    // Whole hours from ten up; the past two weeks keep tenths, they are short.
    const hours = (minutes: number, tenths = minutes < 600) =>
        t('{hours} h', {
            hours: formats.value[tenths ? 'tenths' : 'whole'].format(
                Math.max(0.1, minutes / 60),
            ),
        })

    return {
        query,
        filter,
        filters: computed(() =>
            (
                [
                    ['all', t('All')],
                    ['played', t('Played')],
                    ['unplayed', t('Unplayed')],
                ] as const
            ).map(([value, label]) => ({
                value,
                label,
                on: filter.value === value,
            })),
        ),
        games,
        noMatch: computed(
            () => owned.value.length > 0 && games.value.length === 0,
        ),
        totals: computed(() => {
            const { stats } = toValue(details)
            const money = formats.value.money
            return stats && money
                ? t('{hours} h played · {value}', {
                      hours: formats.value.whole.format(stats.hours),
                      value: money.format(stats.value),
                  })
                : ''
        }),
        columns: computed(() =>
            (['name', 'playtime', 'recent', 'price'] as const).map((key) => ({
                key,
                label: labels.value[key],
                on: order.value.by === key,
            })),
        ),
        sortIcon: computed(() =>
            order.value.dir > 0
                ? 'icon-[lucide--arrow-up]'
                : 'icon-[lucide--arrow-down]',
        ),
        sortBy,
        reverse: () => sortBy(order.value.by),
        sortLabel: computed(() => labels.value[order.value.by]),
        cycleSort: () => {
            const next =
                cycle[(cycle.indexOf(order.value.by) + 1) % cycle.length] ??
                'playtime'
            order.value = { by: next, dir: FIRST_DIR[next] }
        },
        /** Why there is no list: never refreshed here, a hidden library or none at all. */
        empty: computed(() => {
            const games = library.value?.games
            if (games)
                return {
                    title: t('No games'),
                    description: t('This account owns no games yet.'),
                }
            if (games === null)
                return {
                    title: t('Games hidden'),
                    description: t(
                        "This profile's game details are private on Steam.",
                    ),
                }
            return { title: t('Games'), description: missing.value }
        }),
        /** What one row shows; called only for the rows on screen. */
        rowOf(game: LibraryGame) {
            const played = game.minutes > 0
            const money = formats.value.money
            return {
                name: game.name,
                initials: game.name
                    .replace(/[^\p{L}\p{N} ]/gu, '')
                    .split(/\s+/)
                    .map((word) => word[0] ?? '')
                    .join('')
                    .slice(0, 2)
                    .toUpperCase(),
                hue: (game.appId * 47) % 360,
                image: `${CAPSULES}/${game.appId}/capsule_184x69.jpg`,
                store: `https://store.steampowered.com/app/${game.appId}/`,
                playtime: played ? hours(game.minutes) : '—',
                played,
                bar: `${(game.minutes / mostMinutes.value) * 100}%`,
                recent:
                    game.recentMinutes > 0
                        ? hours(game.recentMinutes, true)
                        : '—',
                price:
                    game.price === null
                        ? t('Free')
                        : game.price === undefined || !money
                          ? '—'
                          : money.format(game.price / 100),
                priced: typeof game.price === 'number',
                summary: !played
                    ? t('Never played')
                    : game.recentMinutes > 0
                      ? t('{hours} · {recent} past 2 weeks', {
                            hours: hours(game.minutes),
                            recent: hours(game.recentMinutes, true),
                        })
                      : hours(game.minutes),
            }
        },
    }
}

/** The table as the tab hands it to its rows: refs unwrapped by `reactive`. */
export type GamesTableState = UnwrapNestedRefs<ReturnType<typeof useGamesTable>>
