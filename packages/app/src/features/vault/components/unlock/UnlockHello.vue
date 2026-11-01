<script setup lang="ts">
import { FpButton, FpIcon, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useHelloLabel } from '../../composables/useHelloLabel'

defineProps<{ waiting: boolean }>()
defineEmits<{ start: []; usePassword: [] }>()
const { t } = useI18n()
const hello = useHelloLabel()
const desktop = useDesktopLayout()
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
        <!-- Phones have no method tabs: without a PIN this is the way to the password. -->
        <FpButton v-if="!desktop" variant="ghost" color="accent" size="xl" @click="$emit('usePassword')">
            {{ t('Use master password') }}
        </FpButton>
    </div>
</template>
