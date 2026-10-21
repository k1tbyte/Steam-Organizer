<script setup lang="ts" generic="T extends string | number">
import {
    SelectArrow,
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
import { ARROW_PADDING, FLOAT_GAP } from '../../../placement'
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
        /** Leading icon of the trigger whatever is selected (a timer for a duration). */
        icon?: string
    }>(),
    { size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

// Reka does not register closed or server-rendered menu items.
const normalizedItems = computed(() => props.items.map(toOption))
const selectedOption = computed(() => normalizedItems.value.find((option) => option.value === props.modelValue))
const leadingIcon = computed(() => props.icon ?? selectedOption.value?.icon)

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
            class="field field-raised inline-flex cursor-pointer items-center gap-2 rounded text-fg-1 disabled:pointer-events-none disabled:opacity-50 data-placeholder:text-fg-faint"
            :class="square ? ['touch-target shrink-0 justify-center', SQUARE_SIZES[size]] : ['w-full justify-between', FIELD_SIZES[size]]">
            <SelectValue v-if="square" :placeholder="placeholder" class="flex">
                <FpIcon :name="selectedOption?.icon ?? 'icon-[lucide--chevron-down]'" />
            </SelectValue>
            <SelectValue v-else :placeholder="placeholder" class="flex min-w-0 items-center gap-2">
                <FpIcon v-if="leadingIcon" :name="leadingIcon" class="shrink-0 text-fg-2" />
                <span class="truncate">{{ selectedOption?.label ?? placeholder }}</span>
            </SelectValue>
            <span v-if="!square" class="chevron flex shrink-0 text-fg-3 text-13">
                <FpIcon name="icon-[lucide--chevron-down]" />
            </span>
        </SelectTrigger>

        <SelectPortal>
            <SelectContent
                position="popper"
                side="bottom"
                :side-offset="FLOAT_GAP"
                :collision-padding="8"
                :arrow-padding="ARROW_PADDING"
                class="fp-float fp-menu surface-pop layer-float min-w-(--reka-select-trigger-width) rounded-md">
                <SelectScrollUpButton class="flex shrink-0 justify-center py-1 text-fg-3">
                    <FpIcon name="icon-[lucide--chevron-up]" class="text-13" />
                </SelectScrollUpButton>
                <SelectViewport class="fp-scroll p-1.25">
                    <SelectItem
                        v-for="option in normalizedItems"
                        :key="option.value"
                        :value="option.value"
                        :disabled="option.disabled"
                        class="touch-row flex min-h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 text-fg-1 text-13 outline-none data-highlighted:bg-hover data-disabled:pointer-events-none data-disabled:opacity-50">
                        <FpIcon v-if="option.icon" :name="option.icon" class="shrink-0" />
                        <div class="min-w-0 flex-1">
                            <SelectItemText>{{ option.label }}</SelectItemText>
                            <p v-if="option.description" class="text-fg-3 text-12">{{ option.description }}</p>
                        </div>
                        <SelectItemIndicator class="flex shrink-0 text-accent-ink">
                            <FpIcon name="icon-[lucide--check]" class="text-13" />
                        </SelectItemIndicator>
                    </SelectItem>
                </SelectViewport>
                <SelectScrollDownButton class="flex shrink-0 justify-center py-1 text-fg-3">
                    <FpIcon name="icon-[lucide--chevron-down]" class="text-13" />
                </SelectScrollDownButton>
                <SelectArrow as-child><span class="fp-arrow" /></SelectArrow>
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
