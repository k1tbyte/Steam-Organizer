import {
    computed,
    type MaybeRefOrGetter,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'
import type { Account } from '#features/accounts'
import { BAN_KINDS } from '#features/accounts'

import type { ProfileData } from '../model'

/** The ban rows and the one-line summary the header, the Bans section and the phone chips share. */
export function useBans(
    account: MaybeRefOrGetter<Account>,
    details: MaybeRefOrGetter<ProfileData>,
) {
    const { t } = useI18n()

    const labels = computed(() => ({
        vac: t('VAC'),
        game: t('Game'),
        community: t('Community'),
        economy: t('Trade'),
    }))
    const rows = computed(() =>
        BAN_KINDS.map((kind) => {
            const active = toValue(account).bans.includes(kind)
            return {
                kind,
                label: labels.value[kind],
                active,
                value: active
                    ? (toValue(details).banDetails[kind] ?? t('Banned'))
                    : t('None'),
            }
        }),
    )
    const count = computed(() => rows.value.filter((row) => row.active).length)

    return {
        rows,
        banned: computed(() => count.value > 0),
        /** The summary chip the header and the phone identity wear. */
        icon: computed(() =>
            count.value > 0
                ? 'icon-[lucide--shield-alert]'
                : 'icon-[lucide--shield-check]',
        ),
        summary: computed(() =>
            count.value === 0
                ? t('No bans')
                : t('{count} active ban | {count} active bans', count.value),
        ),
        lastBan: computed(() => toValue(details).lastBan),
    }
}
export type BansState = UnwrapNestedRefs<ReturnType<typeof useBans>>
