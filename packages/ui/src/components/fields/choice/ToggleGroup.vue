<script setup lang="ts" generic="T extends string | number, M extends boolean = false">
import type { AcceptableValue } from 'reka-ui'
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { computed } from 'vue'
import { type FieldSize, type Option, toOption } from '../field'

export type ToggleOption<T extends string | number = string | number> = Option<T>
type Model = M extends true ? T[] : T

const props = withDefaults(
    defineProps<{
        items: (ToggleOption<T> | T)[]
        modelValue?: Model
        multiple?: M
    size?: FieldSize
        /** Fill the container, splitting the width evenly between the items. */
        block?: boolean
        disabled?: boolean
    }>(),
    { size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: Model] }>()

/** Keep one item selected when reka tries to clear the current value. */
function onUpdate(value: AcceptableValue | AcceptableValue[] | undefined) {
    if (value === undefined) return
    emit('update:modelValue', value as Model)
}

const normalized = computed<ToggleOption<T>[]>(() => props.items.map(toOption))

// A generic prop gets no Boolean casting, so a bare `multiple` arrives as ''.
const isMultiple = computed(() => props.multiple !== undefined && props.multiple !== false)

const SIZES: Record<FieldSize, string> = {
    sm: 'h-6 px-2.5 text-12',
    md: 'h-7 px-3 text-12.5',
    lg: 'h-8 px-3 text-13',
}

// The track takes the control height, so a segmented row lines up with buttons and fields.
const TRACK: Record<FieldSize, string> = {
    sm: 'touch-control-sm',
    md: 'touch-control-md',
    lg: 'touch-control-lg',
}
</script>

<!-- Segments grow, so a track stretched by its parent (a stacked form row) is filled, not left half empty. -->
<template>
    <ToggleGroupRoot
        :model-value="modelValue"
        :type="isMultiple ? 'multiple' : 'single'"
        @update:model-value="onUpdate"
        :disabled="disabled"
        class="max-w-full items-stretch gap-0.5 rounded bg-surface-hi p-0.75"
        :class="[TRACK[size], block ? 'flex w-full flex-nowrap' : 'inline-flex flex-wrap']">
        <ToggleGroupItem
            v-for="option in normalized"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
            class="seg inline-flex grow cursor-pointer items-center justify-center gap-1.5 rounded-sm font-medium text-fg-2 transition-colors duration-fast data-[state=on]:bg-accent-soft data-[state=on]:text-accent-ink hover:not-disabled:data-[state=off]:text-fg-1 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            :class="[SIZES[size], block && 'min-w-0 basis-0']">
            <slot :option="option">{{ option.label }}</slot>
        </ToggleGroupItem>
    </ToggleGroupRoot>
</template>
