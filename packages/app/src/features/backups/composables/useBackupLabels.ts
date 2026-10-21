import { useI18n } from 'vue-i18n'

import type { Backup } from '../model'
import {
    backupDay,
    formatDate,
    formatSize,
    formatTime,
} from '../services/backupFormat'

/** How one backup reads on screen; the history and the restore dialog share it. */
export function useBackupLabels() {
    const { t } = useI18n()

    function titleOf(backup: Backup): string {
        if (backup.name) return backup.name
        return backup.kind === 'auto' ? t('Auto backup') : t('Manual backup')
    }

    function iconOf(backup: Backup): string {
        return backup.kind === 'auto'
            ? 'icon-[lucide--history]'
            : 'icon-[lucide--save]'
    }

    function whenOf(backup: Backup): string {
        const time = formatTime(backup.createdAt)
        switch (backupDay(backup.createdAt, Date.now())) {
            case 'now':
                return t('Just now')
            case 'today':
                return t('Today, {time}', { time })
            case 'yesterday':
                return t('Yesterday, {time}', { time })
            default:
                return `${formatDate(backup.createdAt)}, ${time}`
        }
    }

    function accountsOf(count: number): string {
        return t('{count} account | {count} accounts', count)
    }

    const sizeOf = (backup: Backup) => formatSize(backup.sizeBytes)

    return { titleOf, iconOf, whenOf, accountsOf, sizeOf }
}
