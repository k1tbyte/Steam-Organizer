import { type AccountSecret, MOVABLE_FIELDS, readAccount } from '@so/core'
import { computed, shallowRef, watch } from 'vue'

import { useVaultSession } from '#features/vault'

import { wholeAccount } from '../../services/vaultAccounts'

/** One account's secret, opened again whenever its record changes; `held` is false for a sample (no record has its id).
 *  Movable fields read the same wherever the vault places them. A locked account's opens only while its key is held. */
export function useAccountSecret(id: string) {
    const session = useVaultSession()
    const record = computed(() =>
        session.contents?.records.find(
            (found) => found.id === id && !('deleted' in found),
        ),
    )
    const sealed = computed(
        () =>
            readAccount(session.contents?.data.get(id))?.lock !== undefined &&
            session.keyOf(id) === undefined,
    )
    const secret = shallowRef<AccountSecret>()
    watch(
        [record, sealed],
        async ([current, locked], _, onCleanup) => {
            let live = true
            onCleanup(() => {
                live = false
            })
            const opened =
                current &&
                !locked &&
                (await session.secretOf<AccountSecret>(id))
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
    return {
        held: computed(() => record.value !== undefined),
        secret,
        /** The account with what an `everything` lock hid, once its secret is open. */
        whole: computed(() => {
            const hidden = secret.value?.hidden
            const data = session.contents?.data
            return hidden && data && wholeAccount(data, id, hidden)
        }),
    }
}
