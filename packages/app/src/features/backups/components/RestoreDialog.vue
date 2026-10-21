<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpFormField,
    FpIcon,
    FpIconTile,
    FpInput,
    FpModal,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useBackupLabels } from '../composables/useBackupLabels'
import type { RestoreBackup } from '../composables/useRestoreBackup'

const props = defineProps<{ restore: RestoreBackup }>()

const { t } = useI18n()
const { accountsOf } = useBackupLabels()
const { open, summary, vault, password, problem, busy, done } = props.restore
</script>

<template>
    <FpModal
        v-model:open="open"
        :title="t('Restore backup')"
        :dismissible="!busy"
        width="min(92vw, 30rem)">
        <template v-if="summary && vault">
            <div v-if="!done" class="flex flex-col gap-4">
                <div class="flex flex-col gap-3 rounded bg-surface-hi p-3.5">
                    <div class="flex items-center gap-3">
                        <FpIconTile :name="summary.icon" size="base" class="bg-surface!" />
                        <div class="flex min-w-0 flex-1 flex-col gap-px">
                            <span class="truncate font-semibold text-14 text-fg-1">{{ summary.title }}</span>
                            <span class="text-12.5 text-fg-3">{{ summary.when }}</span>
                        </div>
                    </div>
                    <dl class="grid grid-cols-3 gap-2 border-stroke-1 border-t border-dashed pt-3">
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-12 text-fg-3">{{ t('Accounts') }}</dt>
                            <dd class="font-mono font-semibold text-15 text-fg-1">{{ summary.accounts }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-12 text-fg-3">{{ t('Size') }}</dt>
                            <dd class="font-mono font-semibold text-15 text-fg-1">{{ summary.size }}</dd>
                        </div>
                        <div class="flex flex-col gap-0.5">
                            <dt class="text-12 text-fg-3">{{ t('Password') }}</dt>
                            <dd class="font-semibold text-13.5 text-fg-1">
                                {{ summary.olderPassword ? t('Older') : t('Current') }}
                            </dd>
                        </div>
                    </dl>
                </div>
                <FpAlert color="warning">
                    {{ t('Replaces everything in {name} ({accounts} now). Changes made after this backup are lost.', { name: vault.name, accounts: accountsOf(vault.accounts) }) }}
                </FpAlert>
                <FpFormField
                    v-if="summary.olderPassword"
                    :label="t('Backup password')"
                    :description="t('Made before you changed the master password')"
                    :error="problem ?? undefined">
                    <FpInput
                        v-model="password"
                        type="password"
                        :placeholder="t('Password at that time')"
                        @update:model-value="restore.clearProblem"
                        @keydown.enter="restore.submit">
                        <template #leading>
                            <FpIcon name="icon-[lucide--key-round]" />
                        </template>
                    </FpInput>
                </FpFormField>
            </div>
            <div v-else class="flex flex-col items-center gap-2.5 px-3 pt-4 pb-1 text-center">
                <FpIconTile size="lg" color="success" name="icon-[lucide--circle-check]" />
                <span class="font-semibold text-16 text-fg-1">
                    {{ t('Restored {count} account | Restored {count} accounts', summary.accounts) }}
                </span>
                <span class="text-13 text-fg-3 leading-normal text-pretty">
                    {{ t('From the backup of {date}. Other devices get it on their next sync.', { date: summary.date }) }}
                </span>
            </div>
        </template>

        <template v-if="!done" #footer-start>
            <span class="text-12 text-fg-3">{{ t('The vault keeps your current master password') }}</span>
        </template>
        <template #footer>
            <template v-if="!done">
                <FpButton
                    variant="ghost"
                    size="lg"
                    :disabled="busy"
                    :label="t('Cancel')"
                    @click="restore.close" />
                <FpButton
                    color="accent"
                    size="lg"
                    :variant="busy ? 'soft' : 'solid'"
                    :loading="busy"
                    :label="busy ? t('Restoring…') : t('Restore')"
                    @click="restore.submit" />
            </template>
            <FpButton
                v-else
                color="accent"
                size="lg"
                :label="t('Done')"
                @click="restore.close" />
        </template>
    </FpModal>
</template>
