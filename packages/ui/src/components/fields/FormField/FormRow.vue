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
    /** Tighter rows for long lists of one-line settings. */
    compact?: boolean
    /** Label and control stay on one line on phones too (a switch, a short button). */
    inline?: boolean
}>()

// Stacked puts the control under the label; the default stacks only below sm.
const LAYOUT = {
    stacked: { row: 'flex-col gap-2.5', label: "", control: "w-full" },
    inline: {
        row: "flex-row items-center justify-between gap-6",
        label: "flex-1",
        control: "shrink-0 items-end",
    },
    responsive: {
        row: "flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        label: "sm:flex-1",
        control: "sm:shrink-0 sm:items-end",
    },
}
const layout = computed(() => LAYOUT[props.stacked ? "stacked" : props.inline ? "inline" : "responsive"])

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

<!-- One settings row: label and hint left (an icon before them, or markup in place of the label text), control right; hairline above, so rows stack as a list. -->
<template>
    <div
        class="flex border-stroke-1 border-t"
        :class="[compact ? 'py-3' : 'py-3.5', layout.row]">
        <div class="flex min-w-0 items-center gap-3.5" :class="layout.label">
            <slot name="leading" />
            <div class="flex min-w-0 flex-col gap-0.5">
                <span v-if="plain" class="font-medium text-14 text-fg-1"><slot name="label">{{ label }}</slot></span>
                <FpLabel v-else :for="id" class="text-14! text-fg-1!"><slot name="label">{{ label }}</slot></FpLabel>
                <p
                    v-if="description"
                    :id="descriptionId"
                    class="text-12.5 text-fg-3">
                    {{ description }}
                </p>
            </div>
        </div>
        <div class="flex flex-col gap-1" :class="layout.control">
            <FpErrorTip :error="props.error">
                <slot />
            </FpErrorTip>
            <p v-if="props.error" :id="errorId" class="sr-only" role="alert">
                {{ props.error }}
            </p>
        </div>
    </div>
</template>
