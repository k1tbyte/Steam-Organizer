import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import {
    SYNC_INTERVALS,
    type SyncInterval,
    useBackupCount,
    useVaultSync,
} from '#features/backups'

import { useDriveSync } from '../../composables/sources/useDriveSync'

export function useSyncSection() {
    const { t } = useI18n()
    const router = useRouter()
    const engine = useVaultSync()
    const drive = useDriveSync()
    const backups = useBackupCount()

    const intervalItems = computed(() =>
        SYNC_INTERVALS.map((minutes) => ({
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
        autoSync: computed(() => engine.settings.autoSync),
        setAutoSync: (on: boolean) => engine.setSettings({ autoSync: on }),
        interval: computed(() => engine.settings.interval),
        setInterval: (value: SyncInterval) =>
            engine.setSettings({ interval: value }),
        intervalItems,
        autoBackup: computed(() => engine.settings.autoBackup),
        setAutoBackup: (on: boolean) => engine.setSettings({ autoBackup: on }),
        hasBackupsInfo: computed(() => backups.value !== undefined),
        backupsLine,
        openBackups,
    }
}
