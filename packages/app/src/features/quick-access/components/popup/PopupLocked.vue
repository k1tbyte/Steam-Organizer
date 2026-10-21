<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpIconTile, FpInput } from '@so/ui'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePopupUnlock } from '../../composables/usePopupUnlock'

defineEmits<{ forgot: [] }>()

const { t } = useI18n()
const { password, message, busy, submit } = usePopupUnlock()
const input = useTemplateRef('input')
onMounted(() => input.value?.focus())
</script>

<template>
    <form class="flex flex-1 flex-col items-center justify-center gap-3.5 px-8 pb-6 text-center" @submit.prevent="submit">
        <FpIconTile size="lg" name="icon-[lucide--lock-keyhole]" class="size-14! text-24! text-fg-1" />
        <div class="flex flex-col gap-1.5">
            <span class="font-semibold text-18 tracking-title text-fg-1">{{ t('Vault locked') }}</span>
            <span class="text-13 leading-normal text-fg-3 text-pretty">
                {{ t('Enter your master password. The vault stays unlocked in this browser until you close it.') }}
            </span>
        </div>
        <FpFormField class="mt-1.5" :error="message">
            <FpInput
                ref="input"
                v-model="password"
                class="h-11!"
                type="password"
                :aria-label="t('Master password')"
                :placeholder="t('Master password')">
                <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
            </FpInput>
        </FpFormField>
        <FpButton block type="submit" color="accent" size="xl" class="h-11!" :loading="busy">{{ t('Unlock') }}</FpButton>
        <FpButton variant="ghost" size="sm" class="text-fg-3!" @click="$emit('forgot')">
            {{ t('Forgot password?') }}
        </FpButton>
    </form>
</template>
