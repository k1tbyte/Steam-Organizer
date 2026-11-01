<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useHelloLabel } from '../../composables/useHelloLabel'

defineProps<{ waiting: boolean }>()
defineEmits<{ start: [] }>()
const { t } = useI18n()
const hello = useHelloLabel()
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
            {{ t('Unlock with {hello}', { hello }) }}
        </FpButton>
        <FpButton v-else block variant="soft" color="accent" size="2xl" loading>
            {{ t('Waiting for {hello}…', { hello }) }}
        </FpButton>
        <span class="text-center text-12.5 text-fg-3">{{ t('Uses a passkey on this device') }}</span>
    </div>
</template>
