<script setup lang="ts">
import { computed, useId } from 'vue'
import FpErrorTip from '../ErrorTip.vue'
import FpLabel from '../Label.vue'
import { provideFormField } from './form-field'

const props = defineProps<{
    label: string
    description?: string
    error?: string
    plain?: boolean
    nowrap?: boolean
}>()

const id = useId()
const descriptionId = `${id}-description`
const errorId = `${id}-error`
const describedBy = computed(() => {
    const ids = []
    if (props.description) ids.push(descriptionId)
    if (props.error) ids.push(errorId)
    return ids.length > 0 ? ids.join(' ') : undefined
})
provideFormField({
    id,
    invalid: computed(() => Boolean(props.error)),
    describedBy,
})
</script>

<template>
    <div class="flex  gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
        :class="{ 'flex-col': !props.nowrap }"
    >
        <div class="flex flex-col gap-1 sm:flex-1">
            <span v-if="plain" class="font-medium text-fg-1 text-sm">{{ label }}</span>
            <FpLabel v-else :for="id">{{ label }}</FpLabel>
            <p
                v-if="description"
                :id="descriptionId"
                class="line-clamp-2 text-fg-3 text-xs">
                {{ description }}
            </p>
        </div>
        <div class="flex w-full flex-col gap-1 sm:w-64 sm:items-end"
            :class="{ 'flex-1 justify-center items-end': props.nowrap }"
        >
            <FpErrorTip :error="props.error">
                <slot />
            </FpErrorTip>
            <p v-if="props.error" :id="errorId" class="sr-only" role="alert">
                {{ props.error }}
            </p>
        </div>
    </div>
</template>
