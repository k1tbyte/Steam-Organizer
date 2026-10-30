<script setup lang="ts">
import { FpFormField, FpIcon, FpInput, FpSegmentedMeter, FpShake } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { PasswordFields } from './usePasswordFields'

defineProps<{ fields: PasswordFields; nextLabel: string; repeatLabel: string }>()
const { t } = useI18n()
</script>

<template>
    <FpFormField :label="t('Current password')" :error="fields.currentError.value">
        <FpShake :trigger="fields.failedAttempts.value">
            <FpInput
                v-model="fields.current.value"
                type="password"
                autocomplete="current-password"
                :placeholder="t('Master password')">
                <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
            </FpInput>
        </FpShake>
    </FpFormField>
    <div class="flex flex-col gap-2.5">
        <FpFormField :label="nextLabel">
            <FpInput
                v-model="fields.next.value"
                type="password"
                autocomplete="new-password"
                :placeholder="fields.lengthHint.value">
                <template #leading><FpIcon name="icon-[lucide--lock-keyhole]" /></template>
            </FpInput>
        </FpFormField>
        <FpSegmentedMeter
            :value="fields.strength.value"
            :tone="fields.strengthTone.value"
            :label="fields.strengthLabel.value" />
        <FpFormField :error="fields.repeatError.value">
            <FpInput
                v-model="fields.repeat.value"
                type="password"
                autocomplete="new-password"
                :aria-label="repeatLabel"
                :placeholder="repeatLabel"
                :valid="fields.repeatMatches.value">
                <template #leading><FpIcon name="icon-[lucide--repeat-2]" /></template>
            </FpInput>
        </FpFormField>
    </div>
</template>
