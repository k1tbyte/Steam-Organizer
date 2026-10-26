import {
    FIELD_DEFAULTS,
    type FieldDefaults,
    readSettings,
    SETTINGS_ID,
} from '@so/core'
import { computed } from 'vue'

import { useFieldPlacementStore } from '../../stores/fieldPlacement'
import { useAccountsSource } from '../useAccountsSource'

/** Where the vault keeps each movable field, and the move to a new placement. A sample shows the defaults and moves nothing. */
export function useFieldPlacement() {
    const { session, sample, onVault } = useAccountsSource()
    const store = useFieldPlacementStore()
    const settings = computed(() =>
        onVault.value
            ? readSettings(session.contents?.data.get(SETTINGS_ID))
            : null,
    )

    return {
        placement: computed<FieldDefaults>(
            () => settings.value?.fieldDefaults ?? FIELD_DEFAULTS,
        ),
        accountCount: computed(() => sample.value?.accounts.length ?? 0),
        /** A move that stopped before the last account (the app closed): applying again finishes it. */
        interrupted: computed(
            () => settings.value?.moving === true && store.run === null,
        ),
        run: computed(() => store.run),
        finished: computed(() => store.finished),
        apply: (target: FieldDefaults) =>
            onVault.value ? store.apply(target) : Promise.resolve(),
        dismiss: store.dismiss,
    }
}
