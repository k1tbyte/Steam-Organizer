<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpEyebrow,
    FpFormRow,
    FpIconTile,
    FpSelect,
    FpSwitch,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useSecuritySection } from './useSecuritySection'

const emit = defineEmits<{ changePassword: []; setPin: []; enableHello: [] }>()

const { t } = useI18n()
const view = useSecuritySection(emit)
</script>

<template>
    <div>
        <FpEyebrow class="ml-0! pt-1.5 pb-2">{{ t('Auto-lock') }}</FpEyebrow>
        <FpFormRow
            :label="t('Lock after')"
            :description="t('Time without activity in the app, popup or autofill')">
            <div class="w-full sm:w-52.5">
                <FpSelect
                    size="sm"
                    icon="icon-[lucide--timer]"
                    :aria-label="t('Lock after')"
                    :items="view.lockItems.value"
                    :model-value="view.lockAfter.value"
                    @update:model-value="view.setLockAfter" />
            </div>
        </FpFormRow>
        <FpAlert
            v-if="view.neverWarning.value"
            color="warning"
            class="mb-3.5"
            :description="view.neverWarning.value" />
        <FpFormRow
            plain
            :label="view.rows.value.restart.label"
            :description="view.rows.value.restart.description">
            <FpSwitch
                :model-value="view.rows.value.restart.on"
                :aria-label="view.rows.value.restart.label"
                @update:model-value="view.rows.value.restart.set" />
        </FpFormRow>

        <FpEyebrow class="ml-0! pt-5.5 pb-2">{{ t('Unlock with') }}</FpEyebrow>
        <FpFormRow
            plain
            :label="t('Master password')"
            :description="t('Works on every device. Can\'t be recovered.')">
            <template #leading>
                <FpIconTile name="icon-[lucide--key-round]" size="sm" />
            </template>
            <FpButton
                size="sm"
                variant="soft"
                :label="t('Change…')"
                @click="$emit('changePassword')" />
        </FpFormRow>
        <FpFormRow plain :label="view.rows.value.pin.label" :description="view.rows.value.pin.description">
            <template #leading>
                <FpIconTile name="icon-[lucide--grid-3x3]" size="sm" />
            </template>
            <div v-if="view.rows.value.pin.on" class="flex gap-1.5">
                <FpButton
                    size="sm"
                    variant="soft"
                    :label="t('Change')"
                    @click="$emit('setPin')" />
                <FpButton
                    size="sm"
                    variant="ghost"
                    class="text-fg-3! hover:bg-danger-soft! hover:text-danger!"
                    :label="t('Remove')"
                    @click="view.rows.value.pin.set(false)" />
            </div>
            <FpButton
                v-else
                size="sm"
                color="accent"
                :label="t('Set PIN')"
                @click="$emit('setPin')" />
        </FpFormRow>
        <FpFormRow
            plain
            :label="view.rows.value.hello.label"
            :description="view.rows.value.hello.description">
            <template #leading>
                <FpIconTile name="icon-[lucide--fingerprint]" size="sm" />
            </template>
            <FpSwitch
                :model-value="view.rows.value.hello.on"
                :disabled="view.rows.value.hello.disabled"
                :aria-label="view.rows.value.hello.label"
                @update:model-value="view.rows.value.hello.set" />
        </FpFormRow>
    </div>
</template>
