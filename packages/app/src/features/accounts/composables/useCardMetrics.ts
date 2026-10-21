import { useDesktopLayout } from '@so/ui'
import { computed, type Ref } from 'vue'

import { useAppearancePref } from '#core'

import type { CardFlags } from '../model'
import { cardHeightPx, DENSITY_UNITS } from '../services/cardLayout'

// Space between cards, in density units: the phone list sits a little tighter.
const DESKTOP_GAP_UNITS = 3
const PHONE_GAP_UNITS = 2.5

/** Platform and density, the two inputs of a card's size besides its flags. */
export function useCardMetrics(flags: Ref<CardFlags>) {
    const desktop = useDesktopLayout()
    const density = useAppearancePref('density')

    const unit = computed(() => DENSITY_UNITS[density.state.value])
    const touch = computed(() => !desktop.value)

    return {
        touch,
        unit,
        gapUnits: computed(() =>
            desktop.value ? DESKTOP_GAP_UNITS : PHONE_GAP_UNITS,
        ),
        cardPx: computed(() =>
            cardHeightPx(flags.value, touch.value, unit.value),
        ),
    }
}
