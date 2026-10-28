<script setup lang="ts">
import {
    FpAvatar,
    FpButton,
    FpCard,
    FpIcon,
    FpSwitch,
    FpTruncate,
    useDesktopLayout,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useBackupLabels } from '../composables/useBackupLabels'
import { useBackupsVault } from '../composables/useBackupsVault'
import { useDriveAccount } from '../composables/useDriveAccount'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { vault } = useBackupsVault()
const { accountsOf } = useBackupLabels()
const { identity, autoBackup, autoSync, openSyncSettings, disconnect } = useDriveAccount()
</script>

<!-- Desktop: the account, the vault and the two switches beside the history. Phones keep the address only. -->
<template>
    <template v-if="identity">
        <div v-if="desktop && vault" class="flex min-w-0 flex-col gap-u-4">
            <FpCard>
                <div class="flex items-center gap-3">
                    <FpAvatar size="lg" round :alt="identity.name" />
                    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                        <FpTruncate :text="identity.name" class="font-semibold text-14 text-fg-1" />
                        <FpTruncate :text="identity.email" class="text-12.5 text-fg-3" />
                    </div>
                    <FpIcon name="icon-[simple-icons--googledrive]" class="text-17 text-fg-3" />
                </div>
                <div class="flex items-center gap-2 border-stroke-1 border-t border-dashed pt-3 text-12.5 text-fg-3">
                    <FpIcon name="icon-[lucide--vault]" class="text-14" />
                    <span class="flex-1">
                        {{ t('{name} · {accounts}', { name: vault.name, accounts: accountsOf(vault.accounts) }) }}
                    </span>
                    <button
                        type="button"
                        class="touch-target transition-colors duration-fast hover:text-danger"
                        @click="disconnect">
                        {{ t('Disconnect') }}
                    </button>
                </div>
            </FpCard>
            <FpCard flush class="px-4 py-1">
                <div class="border-stroke-1 border-t py-3">
                    <FpSwitch
                        v-model="autoBackup"
                        :label="t('Auto backup')"
                        :description="t('After changes')" />
                </div>
                <div class="border-stroke-1 border-t py-3">
                    <FpSwitch
                        v-model="autoSync"
                        :label="t('Auto sync')"
                        :description="t('On focus and every 15 min')" />
                </div>
                <div class="border-stroke-1 border-t py-3">
                    <FpButton variant="link" color="accent" @click="openSyncSettings">
                        {{ t('More in Settings') }}
                        <FpIcon name="icon-[lucide--arrow-right]" aria-hidden="true" />
                    </FpButton>
                </div>
            </FpCard>
        </div>
        <div v-else-if="!desktop" class="flex items-center gap-2 px-1 text-12 text-fg-3">
            <FpIcon name="icon-[simple-icons--googledrive]" />
            {{ identity.email }}
        </div>
    </template>
</template>
