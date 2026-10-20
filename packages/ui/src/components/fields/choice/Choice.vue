<script setup lang="ts" generic="T extends string">
import { RadioGroupItem } from 'reka-ui'

defineProps<{ value: T; disabled?: boolean }>()
</script>

<template>
    <RadioGroupItem
        :value="value"
        :disabled="disabled"
        class="choice min-w-0 cursor-pointer rounded-md text-left transition-colors duration-fast focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50">
        <slot />
    </RadioGroupItem>
</template>

<style scoped>
.choice[data-state='unchecked'] {
    box-shadow: inset 0 0 0 1px var(--stroke-1);
}

.choice[data-state='unchecked']:not(:disabled):hover {
    background: var(--hover-bg);
}

.choice[data-state='checked'] {
    box-shadow: inset 0 0 0 2px var(--accent);
}
</style>
