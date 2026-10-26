<script setup lang="ts">
import { FpFormField, FpInput, FpKbd } from '@so/ui'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

/** A registry row's name in place: Enter saves, Esc cancels, leaving the field saves what can be saved. */
defineProps<{ message: string | undefined; maxlength: number; label: string }>()
const emit = defineEmits<{ save: []; cancel: []; leave: [] }>()
const name = defineModel<string>({ required: true })

const { t } = useI18n()
const input = useTemplateRef('input')
onMounted(() => input.value?.focus())
</script>

<template>
    <FpFormField :error="message" class="min-w-0 flex-1">
        <FpInput
            ref="input"
            v-model="name"
            size="sm"
            :maxlength
            :aria-label="label"
            @submit="emit('save')"
            @keydown.esc.prevent.stop="emit('cancel')"
            @blur="emit('leave')">
            <template #trailing>
                <span class="flex items-center gap-1 text-11.5 text-fg-3 max-lg:hidden">
                    <FpKbd>↵</FpKbd> {{ t('save') }} · <FpKbd value="Esc" /> {{ t('cancel') }}
                </span>
            </template>
        </FpInput>
    </FpFormField>
</template>
