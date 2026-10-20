<script setup lang="ts" generic="T extends string">
import { RadioGroupRoot } from 'reka-ui'

withDefaults(
    defineProps<{
        modelValue?: T
        orientation?: 'vertical' | 'horizontal'
        disabled?: boolean
    }>(),
    { orientation: 'vertical' },
)

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
    <RadioGroupRoot
        :model-value="modelValue"
        :orientation="orientation"
        :disabled="disabled"
        @update:model-value="emit('update:modelValue', $event as T)">
        <slot />
    </RadioGroupRoot>
</template>
