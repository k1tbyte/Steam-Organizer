<script setup lang="ts">
import {
    FpAvatar,
    FpButton,
    FpDot,
    FpFormRow,
    FpIcon,
    FpSwitch,
    FpToggleGroup,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import IdentityCard from '../../components/IdentityCard.vue'
import { useSyncSection } from './useSyncSection'

const { t } = useI18n()
const view = useSyncSection()
</script>

<template>
    <div>
        <IdentityCard v-if="view.connected.value && view.account.value">
            <template #leading>
                <FpAvatar
                    size="lg"
                    round
                    class="bg-accent! bg-none! font-semibold text-accent-fg!"
                    :alt="view.account.value.name" />
            </template>
            <span class="truncate font-semibold text-14 text-fg-1">{{ view.account.value.name }}</span>
            <span class="flex flex-wrap items-center gap-x-1.5 text-12.5 text-fg-3">
                <span class="truncate">{{ view.account.value.email }}</span>
                <span class="size-0.75 rounded-full bg-fg-faint" />
                <FpDot :color="view.statusColor.value" />
                {{ view.statusText.value }}
            </span>
            <template #actions>
                <FpButton
                    v-if="view.expired.value"
                    size="sm"
                    color="danger"
                    :label="t('Sign in again')"
                    :loading="view.connecting.value"
                    @click="view.connect" />
                <FpButton
                    v-else-if="view.canSyncNow.value"
                    size="sm"
                    variant="outline"
                    :loading="view.syncing.value"
                    @click="view.syncNow">
                    <FpIcon name="icon-[lucide--refresh-cw]" class="text-14" />
                    {{ t('Sync now') }}
                </FpButton>
                <FpButton
                    size="sm"
                    variant="ghost"
                    class="text-fg-3! hover:bg-danger-soft! hover:text-danger!"
                    :label="t('Disconnect')"
                    @click="view.disconnect" />
            </template>
        </IdentityCard>
        <IdentityCard v-else-if="!view.connected.value" outlined>
            <template #leading>
                <FpAvatar size="lg" round>
                    <FpIcon name="icon-[simple-icons--googledrive]" class="text-18" />
                </FpAvatar>
            </template>
            <span class="font-semibold text-14 text-fg-1">{{ t("Google Drive isn't connected") }}</span>
            <span class="text-12.5 text-fg-3">{{ t('Backups and sync between devices need it') }}</span>
            <template #actions>
                <FpButton
                    size="sm"
                    color="accent"
                    :label="t('Connect')"
                    :loading="view.connecting.value"
                    @click="view.connect" />
            </template>
        </IdentityCard>

        <FpFormRow
            plain
            inline
            class="mt-2.5"
            :label="t('Auto sync')"
            :description="t('Check Drive when the app opens or gets focus. Changes from other devices merge account by account.')">
            <FpSwitch
                :model-value="view.autoSync.value"
                :aria-label="t('Auto sync')"
                @update:model-value="view.setAutoSync" />
        </FpFormRow>
        <FpFormRow
            plain
            inline
            :class="!view.autoSync.value && 'opacity-45'"
            :label="t('Also check every')"
            :description="t('While the app stays open')">
            <FpToggleGroup
                :model-value="view.interval.value"
                :items="view.intervalItems.value"
                :aria-label="t('Also check every')"
                @update:model-value="view.setInterval" />
        </FpFormRow>
        <FpFormRow
            plain
            inline
            :label="t('Auto backup')"
            :description="t('Save a copy to Drive history after changes')">
            <FpSwitch
                :model-value="view.autoBackup.value"
                :aria-label="t('Auto backup')"
                @update:model-value="view.setAutoBackup" />
        </FpFormRow>
        <FpFormRow
            v-if="view.hasBackupsInfo.value"
            plain
            inline
            :label="t('Backup history')"
            :description="view.backupsLine.value">
            <FpButton
                size="sm"
                variant="ghost"
                color="accent"
                @click="view.openBackups">
                {{ t('Open Backups') }}
                <FpIcon name="icon-[lucide--arrow-right]" class="text-14" />
            </FpButton>
        </FpFormRow>
    </div>
</template>
