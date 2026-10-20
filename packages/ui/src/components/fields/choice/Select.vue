<script setup lang="ts" generic="T extends string | number">
import {
    SelectContent,
    SelectItem,
    SelectItemIndicator,
    SelectItemText,
    SelectPortal,
    SelectRoot,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectTrigger,
    SelectValue,
    SelectViewport,
} from 'reka-ui'
import { computed, useAttrs } from 'vue'
import { SQUARE_SIZES } from '../../buttons/sizes'
import FpIcon from '../../display/media/Icon.vue'
import { useFormField } from '../FormField/form-field'
import { FIELD_SIZES, type FieldSize, type Option, toOption } from '../field'

export type SelectOption<T extends string | number = string | number> = Option<T>

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        items: (SelectOption<T> | T)[]
        modelValue?: T
        placeholder?: string
        size?: FieldSize
        disabled?: boolean
        /** Icon-only trigger showing the selected option's icon; pass an `aria-label`. */
        square?: boolean
    }>(),
    { size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

// Reka does not register closed or server-rendered menu items.
const normalizedItems = computed(() => props.items.map(toOption))
const selectedOption = computed(() => normalizedItems.value.find((option) => option.value === props.modelValue))

const field = useFormField()

const attrs = useAttrs()
// An icon-only trigger shows no text, so its name carries the selected label.
const label = computed(() => {
    const own = attrs['aria-label'] as string | undefined
    return props.square ? [own, selectedOption.value?.label].filter(Boolean).join(', ') : own
})
</script>

<template>
    <SelectRoot
        :model-value="modelValue"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event as T)">
        <SelectTrigger
            :id="field?.id"
            v-bind="$attrs"
            :aria-label="label"
            :aria-invalid="field?.invalid.value || undefined"
            :aria-describedby="field?.describedBy?.value"
            class="field inline-flex cursor-pointer items-center gap-2 rounded text-fg-1 disabled:pointer-events-none disabled:opacity-50 data-placeholder:text-fg-faint"
            :class="square ? ['touch-target shrink-0 justify-center', SQUARE_SIZES[size]] : ['w-full justify-between', FIELD_SIZES[size]]">
            <SelectValue v-if="square" :placeholder="placeholder" class="flex">
                <FpIcon :name="selectedOption?.icon ?? 'icon-[lucide--chevron-down]'" />
            </SelectValue>
            <SelectValue v-else :placeholder="placeholder" class="flex min-w-0 items-center gap-2">
                <FpIcon v-if="selectedOption?.icon" :name="selectedOption.icon" class="shrink-0 text-fg-2" />
                <span class="truncate">{{ selectedOption?.label ?? placeholder }}</span>
            </SelectValue>
            <span v-if="!square" class="chevron flex shrink-0 text-fg-3 text-sm">
                <FpIcon name="icon-[lucide--chevron-down]" />
            </span>
        </SelectTrigger>

        <SelectPortal>
            <SelectContent
                position="popper"
                side="bottom"
                :side-offset="6"
                :collision-padding="8"
                class="fp-float fp-menu surface layer-float min-w-(--reka-select-trigger-width) rounded">
                <SelectScrollUpButton class="flex shrink-0 justify-center py-1 text-fg-3">
                    <FpIcon name="icon-[lucide--chevron-up]" class="text-sm" />
                </SelectScrollUpButton>
                <SelectViewport class="fp-scroll p-1">
                    <SelectItem
                        v-for="option in normalizedItems"
                        :key="option.value"
                        :value="option.value"
                        :disabled="option.disabled"
                        class="touch-row flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-fg-2 text-sm outline-none data-highlighted:bg-hover data-highlighted:text-fg-1 data-disabled:pointer-events-none data-disabled:opacity-50">
                        <FpIcon v-if="option.icon" :name="option.icon" class="shrink-0" />
                        <div class="min-w-0 flex-1">
                            <SelectItemText>{{ option.label }}</SelectItemText>
                            <p v-if="option.description" class="text-fg-3 text-xs">{{ option.description }}</p>
                        </div>
                        <SelectItemIndicator class="flex shrink-0 text-accent">
                            <FpIcon name="icon-[lucide--check]" class="text-sm" />
                        </SelectItemIndicator>
                    </SelectItem>
                </SelectViewport>
                <SelectScrollDownButton class="flex shrink-0 justify-center py-1 text-fg-3">
                    <FpIcon name="icon-[lucide--chevron-down]" class="text-sm" />
                </SelectScrollDownButton>
            </SelectContent>
        </SelectPortal>
    </SelectRoot>
</template>

<style scoped>
.chevron {
    transition: rotate var(--dur-fast) var(--ease-out);
}
.field[data-state='open'] .chevron {
    rotate: 180deg;
}
</style>
