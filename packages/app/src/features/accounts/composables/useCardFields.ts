import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CardFlags } from '../model'
import { useCardFieldsStore } from '../stores/cardFields'
import { useCardMetrics } from './useCardMetrics'

export interface FieldRow {
    key: keyof CardFlags | 'bot' | 'value'
    label: string
    description: string
    icon: string
    /** Planned, not built: shown off and disabled. */
    later?: true
}

/** The "Card fields" panel: grouped switches over the card's flags and the resulting card height. */
export function useCardFields() {
    const { t } = useI18n()
    const store = useCardFieldsStore()
    const { flags } = storeToRefs(store)
    const metrics = useCardMetrics(flags)

    const groups = computed<{ title: string; rows: FieldRow[] }[]>(() => [
        {
            title: t('Header'),
            rows: [
                {
                    key: 'level',
                    label: t('Level ring'),
                    description: t('Ring and number on the avatar'),
                    icon: 'icon-[lucide--circle-dot]',
                },
                {
                    key: 'age',
                    label: t('Account age'),
                    description: t('Years on Steam, colored by tier'),
                    icon: 'icon-[lucide--hourglass]',
                },
                {
                    key: 'id',
                    label: t('Account ID'),
                    description: t('Click to copy'),
                    icon: 'icon-[lucide--hash]',
                },
                {
                    key: 'bans',
                    label: t('Bans'),
                    description: t('V·G·C·E: VAC, game, community, economy'),
                    icon: 'icon-[lucide--shield-alert]',
                },
            ],
        },
        {
            title: t('Tags'),
            rows: [
                {
                    key: 'tags',
                    label: t('Tags'),
                    description: t('Own row under the avatar'),
                    icon: 'icon-[lucide--tag]',
                },
            ],
        },
        {
            title: t('Footer'),
            rows: [
                {
                    key: 'guard',
                    label: t('Steam Guard'),
                    description: t('Hold to show, button to copy'),
                    icon: 'icon-[lucide--shield-check]',
                },
                {
                    key: 'note',
                    label: t('Note'),
                    description: t('First line of the note'),
                    icon: 'icon-[lucide--sticky-note]',
                },
                {
                    key: 'actions',
                    label: t('Quick actions'),
                    description: t('Open profile, delete'),
                    icon: 'icon-[lucide--mouse-pointer-click]',
                },
            ],
        },
        {
            title: t('Coming later'),
            rows: [
                {
                    key: 'bot',
                    label: t('Bot status'),
                    description: t('ASF: online, farming, cards left'),
                    icon: 'icon-[lucide--bot]',
                    later: true,
                },
                {
                    key: 'value',
                    label: t('Library value'),
                    description: t('Games count and total price'),
                    icon: 'icon-[lucide--wallet]',
                    later: true,
                },
            ],
        },
    ])

    function isOn(row: FieldRow): boolean {
        return !row.later && flags.value[row.key as keyof CardFlags]
    }

    return {
        groups,
        isOn,
        toggle: (row: FieldRow) => {
            if (!row.later) store.toggle(row.key as keyof CardFlags)
        },
        reset: store.reset,
        cardHeight: computed(() => t('{px} px', { px: metrics.cardPx.value })),
    }
}
