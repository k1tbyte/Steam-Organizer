import { computed, watch } from 'vue'

import { useDrive } from '#features/drive'

import { useBackupList } from '../stores/useBackupList'

/** How many backups the open vault has on Drive; undefined until listed. */
export function useBackupCount() {
    const store = useBackupList()
    const drive = useDrive()
    // Lists once per vault and account when nothing is held: the Backups page keeps it fresh.
    watch(
        [() => store.scope, drive.state],
        () => {
            if (store.list === undefined) void store.load()
        },
        { immediate: true },
    )
    return computed(() => store.list?.length)
}
