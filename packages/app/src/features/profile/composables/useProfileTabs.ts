import type { TabsItem } from '@so/ui'
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import type { ProfileData } from '../model'

/** Summary, Games, Friends and, where the vault holds an authenticator, Steam Guard. */
export function useProfileTabs(
    account: MaybeRefOrGetter<Account>,
    details: MaybeRefOrGetter<ProfileData>,
    options: {
        icons: MaybeRefOrGetter<boolean>
        guardHidden: MaybeRefOrGetter<boolean>
    },
) {
    const { t } = useI18n()
    const active = ref<string | number>('summary')

    const items = computed<TabsItem[]>(() => {
        const { stats } = toValue(details)
        const icon = (name: string) =>
            toValue(options.icons) ? name : undefined
        const tabs: TabsItem[] = [
            {
                value: 'summary',
                slot: 'summary',
                label: t('Summary'),
                icon: icon('icon-[lucide--layout-grid]'),
            },
        ]
        if (!toValue(account).anonymous)
            tabs.push(
                {
                    value: 'games',
                    slot: 'games',
                    label: t('Games'),
                    icon: icon('icon-[lucide--gamepad-2]'),
                    count: stats.games,
                },
                {
                    value: 'friends',
                    slot: 'friends',
                    label: t('Friends'),
                    icon: icon('icon-[lucide--users]'),
                    count: stats.friends,
                },
            )
        if (toValue(account).guard && !toValue(options.guardHidden))
            tabs.push({
                value: 'guard',
                slot: 'guard',
                label: t('Steam Guard'),
                icon: icon('icon-[lucide--shield-check]'),
            })
        return tabs
    })

    // The Steam Guard tab goes away when the account locks again.
    watch(items, (tabs) => {
        if (!tabs.some((tab) => tab.value === active.value))
            active.value = 'summary'
    })

    return { active, items }
}
