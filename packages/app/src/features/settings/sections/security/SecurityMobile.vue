<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpCard,
    FpEyebrow,
    FpIcon,
    FpSwitch,
} from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSecuritySection } from './useSecuritySection'

defineEmits<{ changePassword: [] }>()

const { t } = useI18n()
const view = useSecuritySection()

const toggles = computed(() => [
    {
        key: 'pin',
        label: t('PIN'),
        description: view.pinDescription.value,
        on: view.pin.value,
        set: view.setPin,
    },
    {
        key: 'biometrics',
        label: t('Fingerprint'),
        description: t('A passkey on this phone'),
        on: view.biometrics.value,
        set: view.setBiometrics,
    },
    {
        key: 'restart',
        label: t('Master password after restart'),
        description: t('Then PIN and fingerprint work again'),
        on: view.masterAfterRestart.value,
        set: view.setMasterAfterRestart,
    },
])
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
                v-if="view.neverLocks.value"
                color="warning"
                :description="t('The vault stays open until you lock it yourself.')" />
            <p class="px-1 text-12 leading-snug text-fg-3">
                {{ t('Time without activity in the app, popup or autofill') }}
            </p>
        </section>
        <section class="flex flex-col gap-2">
            <FpEyebrow class="px-1">{{ t('Unlock with') }}</FpEyebrow>
            <FpCard flush class="pl-3.5">
                <!-- biome-ignore lint/a11y/noLabelWithoutControl: the switch inside is the control -->
                <label
                    v-for="toggle in toggles"
                    :key="toggle.key"
                    class="flex min-h-14 cursor-pointer items-center gap-3 border-stroke-1 border-t py-1.5 pr-3.5">
                    <span class="flex min-w-0 flex-1 flex-col gap-px">
                        <span class="text-14 text-fg-1">{{ toggle.label }}</span>
                        <span class="text-12 text-fg-3">{{ toggle.description }}</span>
                    </span>
                    <FpSwitch
                        size="lg"
                        :model-value="toggle.on"
                        :aria-label="toggle.label"
                        @update:model-value="toggle.set" />
                </label>
            </FpCard>
        </section>
        <FpButton
            block
            size="2xl"
            variant="soft"
            @click="$emit('changePassword')">
            <FpIcon name="icon-[lucide--key-round]" />
            {{ t('Change master password') }}
        </FpButton>
    </div>
</template>
