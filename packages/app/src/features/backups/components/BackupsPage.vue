<script setup lang="ts">
import { FpButton, FpIcon, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import PageTopbar from '#components/PageTopbar.vue'

import { useBackupHistory } from '../composables/useBackupHistory'
import { useBackupsVault } from '../composables/useBackupsVault'
import { useRestoreBackup } from '../composables/useRestoreBackup'
import BackupHistory from './BackupHistory.vue'
import BackupStatusAlert from './BackupStatusAlert.vue'
import DeviceVaultEmpty from './DeviceVaultEmpty.vue'
import DriveAccountPanel from './DriveAccountPanel.vue'
import RestoreDialog from './RestoreDialog.vue'
import SyncStatus from './SyncStatus.vue'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { vault, onDevice } = useBackupsVault()
const history = useBackupHistory()
const restore = useRestoreBackup(history.backups)
</script>

<template>
    <PageTopbar
        :title="t('Backups')"
        :count="onDevice ? undefined : history.count.value">
        <template #status>
            <span
                v-if="onDevice && vault"
                class="flex items-center gap-1.5 text-11.5 text-fg-3 lg:text-12.5">
                <FpIcon name="icon-[lucide--hard-drive]" aria-hidden="true" />
                {{ t('{name} · this device only', { name: vault.name }) }}
            </span>
            <SyncStatus v-else detailed />
        </template>
        <template v-if="vault && !onDevice" #actions>
            <FpButton
                color="accent"
                :size="desktop ? 'md' : 'xl'"
                :round="!desktop"
                :disabled="!history.canBackUp.value"
                @click="history.backUp">
                <FpIcon name="icon-[lucide--cloud-upload]" aria-hidden="true" />
                {{ history.saving.value ? t('Saving…') : t('Backup now') }}
            </FpButton>
        </template>
    </PageTopbar>

    <DeviceVaultEmpty v-if="onDevice && vault" :name="vault.name" />
    <div
        v-else-if="vault"
        class="grid gap-3 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-u-5 lg:px-u-6 lg:pt-u-5 lg:pb-u-6">
        <div class="flex min-w-0 flex-col gap-3 lg:gap-u-4">
            <BackupStatusAlert />
            <BackupHistory
                :rows="history.rows.value"
                :status="history.status.value"
                @restore="restore.show"
                @ask-delete="history.askDelete"
                @cancel-delete="history.cancelDelete"
                @remove="history.remove" />
        </div>
        <DriveAccountPanel />
    </div>

    <RestoreDialog :restore="restore" />
</template>
