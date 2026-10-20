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
    /** Control under the label at full width, for a grid of choices. */
    stacked?: boolean
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

<!-- One settings row: label and hint left, control right; hairline above, so rows stack as a list. -->
<template>
    <div
        class="flex flex-col gap-2.5 border-stroke-1 border-t py-3.5"
        :class="!stacked && 'sm:flex-row sm:items-center sm:justify-between sm:gap-6'">
        <div class="flex min-w-0 flex-col gap-0.5" :class="!stacked && 'sm:flex-1'">
            <span v-if="plain" class="font-medium text-14 text-fg-1">{{ label }}</span>
            <FpLabel v-else :for="id" class="text-14! text-fg-1!">{{ label }}</FpLabel>
            <p
                v-if="description"
                :id="descriptionId"
                class="text-12.5 text-fg-3">
                {{ description }}
            </p>
        </div>
        <div class="flex flex-col gap-1" :class="stacked ? 'w-full' : 'sm:shrink-0 sm:items-end'">
            <FpErrorTip :error="props.error">
                <slot />
            </FpErrorTip>
            <p v-if="props.error" :id="errorId" class="sr-only" role="alert">
                {{ props.error }}
            </p>
        </div>
    </div>
</template>
