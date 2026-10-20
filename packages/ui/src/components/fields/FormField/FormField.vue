<script setup lang="ts">
import { computed, useId } from 'vue'
import FpLabel from '../Label.vue'
import { provideFormField } from './form-field'

const props = defineProps<{
    label?: string
    hint?: string
    description?: string
    help?: string
    error?: string | boolean
    required?: boolean
}>()

const id = useId()
const errorMessage = computed(() => (typeof props.error === 'string' ? props.error : undefined))
const labelId = `${id}-label`
const descriptionId = `${id}-description`
const messageId = `${id}-message`
const describedBy = computed(() => {
    const ids = []
    if (props.description) ids.push(descriptionId)
    if (errorMessage.value || props.help) ids.push(messageId)
    return ids.length > 0 ? ids.join(' ') : undefined
})

provideFormField({
    id,
    invalid: computed(() => Boolean(props.error)),
    labelledBy: computed(() => (props.label ? labelId : undefined)),
    describedBy,
})
</script>

<template>
    <div class="flex w-full flex-col gap-1.5">
        <div v-if="label || hint" class="flex items-baseline justify-between gap-2">
            <FpLabel :id="labelId" :for="id" :required="required">
                {{ label }}
            </FpLabel>
            <span v-if="hint" class="text-fg-3 text-xs">{{ hint }}</span>
        </div>
        <p v-if="description" :id="descriptionId" class="text-fg-3 text-xs">{{ description }}</p>
        <slot />
        <p v-if="errorMessage" :id="messageId" class="text-danger text-xs" role="alert">{{ errorMessage }}</p>
        <p v-else-if="help" :id="messageId" class="text-fg-3 text-xs">{{ help }}</p>
    </div>
</template>
