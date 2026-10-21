<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ waiting: boolean }>()
defineEmits<{ start: [] }>()
const { t } = useI18n()
</script>

<template>
    <div class="flex flex-col gap-2.5">
        <FpButton
            v-if="!waiting"
            block
            color="accent"
            size="2xl"
            @click="$emit('start')">
            <FpIcon name="icon-[lucide--fingerprint]" class="text-20" aria-hidden="true" />
            {{ t('Unlock with Windows Hello') }}
        </FpButton>
        <FpButton v-else block variant="soft" color="accent" size="2xl" loading>
            {{ t('Waiting for Windows Hello…') }}
        </FpButton>
        <span class="text-center text-12.5 text-fg-3">{{ t('Uses a passkey on this device') }}</span>
    </div>
</template>
