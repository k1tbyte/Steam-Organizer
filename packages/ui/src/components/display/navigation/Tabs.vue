<script setup lang="ts">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { type ComponentPublicInstance, computed, useTemplateRef } from 'vue'
import { useCenterActive } from '../../../composables/useCenterActive'

export interface TabsItem {
    label: string
    value?: string | number
    slot?: string
    content?: string
    disabled?: boolean
}

const props = withDefaults(
    defineProps<{
        items: TabsItem[]
        content?: boolean
    }>(),
    { content: true },
)

const active = defineModel<string | number>()

function tabValue(item: TabsItem, index: number) {
    return item.value ?? String(index)
}

// Default to the first item's resolved value, not its index.
const defaultValue = computed(() => {
    const first = props.items[0]
    return first ? tabValue(first, 0) : undefined
})

const list = useTemplateRef<ComponentPublicInstance>('list')
const { overflows } = useCenterActive(
    () => list.value?.$el,
    active,
    '[role="tab"][data-state="active"]',
    () => props.items,
)
</script>

<template>
    <TabsRoot v-model="active" :default-value="defaultValue" class="flex w-full flex-col gap-3">
        <TabsList
            ref="list"
            class="touch-control-md relative flex w-fit max-w-full items-stretch rounded bg-surface-lo p-1"
            :class="overflows && 'overflow-x-auto'">
            <TabsIndicator
                class="indicator absolute rounded w-(--reka-tabs-indicator-size)" />
            <TabsTrigger
                v-for="(item, index) in items"
                :key="tabValue(item, index)"
                :value="tabValue(item, index)"
                :disabled="item.disabled"
                class="relative z-1 inline-flex shrink-0 items-center gap-1.5 rounded px-4 py-1.5 font-medium text-fg-3 text-sm transition-colors duration-fast hover:not-disabled:data-[state=inactive]:text-fg-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <slot name="trigger" :item="item" :index="index">{{ item.label }}</slot>
            </TabsTrigger>
        </TabsList>

        <template v-if="content">
            <TabsContent
                v-for="(item, index) in items"
                :key="tabValue(item, index)"
                :value="tabValue(item, index)"
                class="animate-settle focus-visible:outline-2 focus-visible:outline-accent">
                <slot :name="item.slot ?? 'content'" :item="item" :index="index">
                    <p class="text-fg-2 text-sm">{{ item.content }}</p>
                </slot>
            </TabsContent>
        </template>
    </TabsRoot>
</template>

<style scoped>
.indicator {
    transition:
        translate var(--dur-slow) var(--ease-spring),
        width var(--dur-base) var(--ease-out);
    left: 0;
    top: 50%;
    height: calc(100% - var(--spacing) * 2);
    translate: var(--reka-tabs-indicator-position) -50%;
    background: var(--select-bg, var(--surf-bg-hi));
    box-shadow:
        0 0 0 1px var(--stroke-2),
        0 1px 0 color-mix(in oklch, white 10%, transparent) inset,
        0 2px 8px -2px color-mix(in oklch, black 40%, transparent);
}
[data-state="active"] {
    color: var(--select-fg, var(--text-1));
}
</style>
