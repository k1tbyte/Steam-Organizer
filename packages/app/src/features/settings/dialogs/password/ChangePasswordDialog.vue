<script setup lang="ts">
import { FpAlert, FpButton, FpIconTile, FpModal } from '@so/ui'
import { useI18n } from 'vue-i18n'

import PasswordFields from './PasswordFields.vue'
import { useChangePassword } from './useChangePassword'

const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const view = useChangePassword(open)
</script>

<template>
    <FpModal v-model:open="open" :title="t('Change master password')" width="min(92vw, 30rem)">
        <form
            v-if="!view.done.value"
            id="change-master-password"
            class="flex flex-col gap-4"
            @submit.prevent="view.submit">
            <PasswordFields
                :fields="view.fields"
                :next-label="t('New password')"
                :repeat-label="t('Repeat new password')" />
            <FpAlert
                v-if="view.synced.value"
                :description="t('Accounts aren\'t re-encrypted, so this takes a moment. PIN and Windows Hello keep working. Other devices ask for the new password on their next unlock.')" />
            <FpAlert
                v-else
                :description="t('Accounts aren\'t re-encrypted, so this takes a moment. PIN and Windows Hello keep working.')" />
        </form>
        <div v-else class="flex flex-col items-center gap-2.5 px-3 pt-4 text-center">
            <FpIconTile name="icon-[lucide--circle-check]" size="lg" color="success" />
            <span class="font-semibold text-16 text-fg-1">{{ t('Master password changed') }}</span>
            <span v-if="view.synced.value" class="text-13 leading-snug text-fg-3">
                {{ t('Synced to Google Drive. Other devices will ask for the new password next time.') }}
            </span>
        </div>
        <template #footer>
            <FpButton v-if="view.done.value" size="lg" color="accent" :label="t('Done')" @click="open = false" />
            <template v-else>
                <FpButton
                    size="lg"
                    variant="ghost"
                    :label="t('Cancel')"
                    @click="open = false" />
                <FpButton
                    size="lg"
                    type="submit"
                    form="change-master-password"
                    color="accent"
                    :disabled="!view.fields.complete.value"
                    :loading="view.saving.value"
                    :label="t('Change password')" />
            </template>
        </template>
    </FpModal>
</template>
