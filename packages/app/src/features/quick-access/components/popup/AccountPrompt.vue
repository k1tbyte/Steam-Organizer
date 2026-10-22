<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpInput, tip } from '@so/ui'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{ name: string; message: string }>()
defineEmits<{ submit: []; cancel: [] }>()

const password = defineModel<string>({ required: true })
const { t } = useI18n()
const input = useTemplateRef('input')
onMounted(() => input.value?.focus())
</script>

<template>
    <form
        class="flex shrink-0 flex-col gap-2 border-t border-stroke-1 bg-canvas-elev p-2.5"
        @submit.prevent="$emit('submit')"
        @keydown.esc.stop="$emit('cancel')">
        <div class="flex items-center gap-2 pl-0.5">
            <FpIcon name="icon-[lucide--lock]" class="text-14 text-fg-3" />
            <span class="min-w-0 flex-1 truncate font-semibold text-13 text-fg-1">
                {{ t('{name} is locked', { name }) }}
            </span>
            <FpButton v-bind="tip(t('Cancel'))" square size="xs" variant="ghost" :aria-label="t('Cancel')" @click="$emit('cancel')">
                <FpIcon name="icon-[lucide--x]" />
            </FpButton>
        </div>
        <FpFormField :error="message">
            <FpInput
                ref="input"
                v-model="password"
                type="password"
                no-reveal
                size="sm"
                :aria-label="t('Account password')"
                :placeholder="t('Account password')">
                <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                <template #trailing>
                    <FpButton type="submit" size="xs" color="accent" class="-mr-1.5">{{ t('Unlock') }}</FpButton>
                </template>
            </FpInput>
        </FpFormField>
    </form>
</template>
