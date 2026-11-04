<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpCard,
    FpEyebrow,
    FpIcon,
    FpSwitch,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useSecuritySection } from './useSecuritySection'

const emit = defineEmits<{ changePassword: []; setPin: []; enableHello: [] }>()

const { t } = useI18n()
const view = useSecuritySection(emit)
</script>

<template>
    <div class="flex flex-col gap-5">
        <section class="flex flex-col gap-2">
            <FpEyebrow class="px-1">{{ t('Lock after') }}</FpEyebrow>
            <FpCard flush class="pl-3.5">
                <button
                    v-for="item in view.lockItems.value"
                    :key="item.value"
                    type="button"
                    class="flex min-h-12 w-full cursor-pointer items-center gap-3 border-stroke-1 border-t pr-3.5 text-left text-14 text-fg-1"
                    @click="view.setLockAfter(item.value)">
                    <span class="flex-1">{{ item.label }}</span>
                    <FpIcon
                        name="icon-[lucide--check]"
                        class="text-17 text-accent-ink"
                        :class="item.value !== view.lockAfter.value && 'opacity-0'" />
                </button>
            </FpCard>
            <FpAlert
                v-if="view.neverWarning.value"
                color="warning"
                :description="view.neverWarning.value" />
            <p class="px-1 text-12 leading-snug text-fg-3">
                {{ t('Time without activity in the app, popup or autofill') }}
            </p>
        </section>
        <section class="flex flex-col gap-2">
            <FpEyebrow class="px-1">{{ t('Unlock with') }}</FpEyebrow>
            <FpCard flush class="pl-3.5">
                <!-- biome-ignore lint/a11y/noLabelWithoutControl: the switch inside is the control -->
                <label
                    v-for="(toggle, key) in view.rows.value"
                    :key="key"
                    class="flex min-h-14 cursor-pointer items-center gap-3 border-stroke-1 border-t py-1.5 pr-3.5">
                    <span class="flex min-w-0 flex-1 flex-col gap-px">
                        <span class="text-14 text-fg-1">{{ toggle.label }}</span>
                        <span class="text-12 text-fg-3">{{ toggle.description }}</span>
                    </span>
                    <FpSwitch
                        size="lg"
                        :model-value="toggle.on"
                        :disabled="toggle.disabled"
                        :aria-label="toggle.label"
                        @update:model-value="toggle.set" />
                </label>
            </FpCard>
        </section>
        <FpButton
            block
            size="2xl"
            variant="soft"
            @click="emit('changePassword')">
            <FpIcon name="icon-[lucide--key-round]" />
            {{ t('Change master password') }}
        </FpButton>
    </div>
</template>
