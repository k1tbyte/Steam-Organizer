import { type AccountSecret, MOVABLE_FIELDS, readAccount } from '@so/core'
import { computed, shallowRef, watch } from 'vue'

import { useVaultSession } from '#features/vault'

/** One account's secret, opened again whenever its record changes; `held` is false for a sample (no record has its id).
 *  Movable fields read the same wherever the vault places them. */
export function useAccountSecret(id: string) {
    const session = useVaultSession()
    const record = computed(() =>
        session.contents?.records.find(
            (found) => found.id === id && !('deleted' in found),
        ),
    )
    const secret = shallowRef<AccountSecret>()
    watch(
        record,
        async (current, _, onCleanup) => {
            let live = true
            onCleanup(() => {
                live = false
            })
            const opened =
                current && (await session.secretOf<AccountSecret>(id))
            const data = readAccount(session.contents?.data.get(id))
            if (!live) return
            const placed = MOVABLE_FIELDS.flatMap((field) =>
                data?.[field] ? [[field, data[field]]] : [],
            )
            secret.value = opened && {
                ...Object.fromEntries(placed),
                ...opened,
            }
        },
        { immediate: true },
    )
    return { held: computed(() => record.value !== undefined), secret }
}
