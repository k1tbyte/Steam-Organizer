<script setup lang="ts">
import { FpKbd } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
    count: string
    /** Enter fills only while the tab has something to fill. */
    canFill: boolean
}>()

const { t } = useI18n()
const hints = computed(() => [
    { key: '↑↓', label: t('select') },
    ...(props.canFill ? [{ key: '↵', label: t('fill') }] : []),
    { key: '⌘C', label: t('password') },
])
</script>

<template>
    <footer class="flex h-9 shrink-0 items-center gap-3 border-t border-stroke-1 px-3 text-11.5 text-fg-3">
        <span v-for="hint in hints" :key="hint.key" class="flex items-center gap-1">
            <FpKbd :value="hint.key" class="h-auto! min-w-0! px-1! text-11.5!" />{{ hint.label }}
        </span>
        <span class="flex-1" />
        <span class="font-mono">{{ count }}</span>
    </footer>
</template>
