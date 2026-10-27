import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ProfileData } from '../model'
import { stampParts } from '../services/stamps'

/** The six Community tiles from the profile's Steam stats; none without them. */
export function useCommunity(details: MaybeRefOrGetter<ProfileData>) {
    const { t, locale } = useI18n()

    const tiles = computed(() => {
        const { stats, registered } = toValue(details)
        if (!stats) return []
        const number = new Intl.NumberFormat(locale.value)
        const playedShare =
            stats.games === 0 ? 0 : (stats.played / stats.games) * 100
        const since =
            registered !== null &&
            stampParts(registered, Date.now(), locale.value).date
        return [
            {
                label: t('Years of service'),
                value: number.format(stats.years),
                sub: since ? t('Since {date}', { date: since }) : undefined,
            },
            {
                label: t('Games'),
                value: number.format(stats.games),
                sub: t('{played} played · {share}%', {
                    played: number.format(stats.played),
                    share: playedShare.toFixed(1),
                }),
                bar: playedShare,
            },
            {
                label: t('Playtime'),
                value: t('{hours} h', { hours: number.format(stats.hours) }),
                sub: t('All games'),
            },
            {
                label: t('Paid games'),
                value: number.format(stats.paid),
                sub: t('of {games}', { games: number.format(stats.games) }),
            },
            {
                label: t('Library value'),
                value: new Intl.NumberFormat(locale.value, {
                    style: 'currency',
                    currency: 'USD',
                }).format(stats.value),
                sub: t('Current store prices'),
                accent: true,
            },
            {
                label: t('Collector badge'),
                value: stats.badge,
                sub: t('Games owned'),
            },
        ]
    })

    return { tiles }
}
