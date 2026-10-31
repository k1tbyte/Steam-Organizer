import { useTimer } from '@so/ui/useTimer'
import { useToast } from '@so/ui/useToast'
import { useEventListener } from '@vueuse/core'
import { onScopeDispose, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDrive } from '#features/drive'
import { useVaultSession } from '#features/vault'

import { AUTO_BACKUP_AFTER_CHANGE_MS } from '../services/autoBackup'
import { useVaultSync } from '../stores/useVaultSync'

const SYNC_AFTER_CHANGE_MS = 3000
// Focus and visibility arrive together: one sync for both.
const TRIGGER_SETTLE_MS = 300
const MINUTE_MS = 60_000

/** Runs Drive sync for the unlocked app: on open, focus, the interval, after changes and when Drive comes back;
 *  pushes what a lock left; says when the copy left Drive or a sync failed. Call once, from the shell. */
export function useAutoSync() {
    const { t } = useI18n()
    const engine = useVaultSync()
    const session = useVaultSession()
    const drive = useDrive()
    const toast = useToast()
    const settle = useTimer()
    const every = useTimer()
    const afterChange = useTimer()
    const backupCheck = useTimer()

    // Checked again when it fires: switching Auto sync off meanwhile starts nothing.
    function auto() {
        if (!engine.settings.autoSync) return
        settle.arm(TRIGGER_SETTLE_MS, () => {
            if (engine.settings.autoSync) void engine.sync()
        })
    }

    // Registered here, before any page's draft writers: the session still hands it the file after their writes.
    const stopLocked = session.onLocked(
        (snapshot) => void engine.flush(snapshot),
    )
    const stopNotices = engine.onNotice((notice) => {
        if (notice.kind === 'gone')
            toast.add({
                color: 'warning',
                title: t('{name} is no longer in Google Drive', {
                    name: notice.vaultName,
                }),
                description: t(
                    'It stays on this device. Move it to Google Drive to sync it again.',
                ),
            })
        else
            toast.add({
                color: 'danger',
                title: t('Drive sync failed'),
                description: t('Changes are saved on this device.'),
                action: {
                    label: t('Retry'),
                    onClick: () => void engine.syncNow(),
                },
            })
    })
    onScopeDispose(() => {
        stopLocked()
        stopNotices()
    })

    function onInterval() {
        every.arm(Number(engine.settings.interval) * MINUTE_MS, () => {
            auto()
            onInterval()
        })
    }
    watch(() => engine.settings.interval, onInterval, { immediate: true })

    useEventListener(document, 'visibilitychange', () => {
        if (document.visibilityState === 'visible') auto()
    })
    useEventListener(window, 'focus', auto)
    watch(drive.state, (state) => {
        if (state === 'connected') auto()
    })
    watch(
        () => engine.settings.autoSync,
        (on) => on && auto(),
    )
    // The shell mounting, or another vault opened under it.
    watch(
        () => session.vault?.id,
        () => {
            auto()
            backupCheck.arm(
                AUTO_BACKUP_AFTER_CHANGE_MS,
                () => void engine.backUpIfDue(),
            )
        },
        { immediate: true },
    )

    // Every write gives the vault a new file, a password change too; a merge from Drive leaves nothing pending by then.
    watch(
        () => session.vaults.find(({ id }) => id === session.vault?.id)?.file,
        () => {
            afterChange.arm(SYNC_AFTER_CHANGE_MS, () => {
                if (session.vault?.sync?.pending) auto()
            })
            backupCheck.arm(
                AUTO_BACKUP_AFTER_CHANGE_MS,
                () => void engine.backUpIfDue(),
            )
        },
    )
}
