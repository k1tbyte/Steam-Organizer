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
            class="relative flex h-10.5 w-full max-w-full items-stretch gap-0.5 border-stroke-1 border-b"
            :class="overflows && 'overflow-x-auto'">
            <TabsIndicator class="indicator absolute" />
            <TabsTrigger
                v-for="(item, index) in items"
                :key="tabValue(item, index)"
                :value="tabValue(item, index)"
                :disabled="item.disabled"
                class="relative z-1 inline-flex shrink-0 items-center gap-1.75 px-3 font-medium text-13.5 text-fg-3 transition-colors duration-fast hover:not-disabled:text-fg-1 data-[state=active]:font-semibold data-[state=active]:text-fg-1 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
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
                    <p class="text-fg-2 text-13">{{ item.content }}</p>
                </slot>
            </TabsContent>
        </template>
    </TabsRoot>
</template>

<style scoped>
/* A 2px accent bar under the active tab, inset 8px from each side. */
.indicator {
    bottom: -1px;
    left: 0;
    height: 2px;
    width: calc(var(--reka-tabs-indicator-size) - 16px);
    border-radius: 2px;
    background: var(--accent);
    translate: calc(var(--reka-tabs-indicator-position) + 8px) 0;
    transition:
        translate var(--dur-slow) var(--ease-spring),
        width var(--dur-base) var(--ease-out);
}
</style>
