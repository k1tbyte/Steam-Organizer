import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useBackupCount } from '#features/backups'

import { useDriveSync } from '../../composables/sources/useDriveSync'
import type { SyncInterval } from '../../model'
import { useSettingsStore } from '../../stores/settingsStore'

const INTERVALS: SyncInterval[] = ['5', '15', '30']

export function useSyncSection() {
    const { t } = useI18n()
    const router = useRouter()
    const store = useSettingsStore()
    const drive = useDriveSync()
    const backups = useBackupCount()

    const intervalItems = computed(() =>
        INTERVALS.map((minutes) => ({
            value: minutes,
            label: t('{minutes} min', { minutes }),
        })),
    )

    const backupsLine = computed(() =>
        t(
            'No backups yet | {count} backup in Google Drive | {count} backups in Google Drive',
            backups.value ?? 0,
        ),
    )

    function openBackups() {
        void router.push('/backups')
    }

    return {
        ...drive,
        autoSync: computed(() => store.sync.autoSync),
        setAutoSync: (on: boolean) => store.setSync({ autoSync: on }),
        interval: computed(() => store.sync.interval),
        setInterval: (value: SyncInterval) =>
            store.setSync({ interval: value }),
        intervalItems,
        autoBackup: computed(() => store.sync.autoBackup),
        setAutoBackup: (on: boolean) => store.setSync({ autoBackup: on }),
        hasBackupsInfo: computed(() => backups.value !== undefined),
        backupsLine,
        openBackups,
    }
}
