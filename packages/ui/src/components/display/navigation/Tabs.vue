<script setup lang="ts">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { type ComponentPublicInstance, computed, useTemplateRef } from 'vue'
import { useCenterActive } from '../../../composables/useCenterActive'
import FpIcon from '../media/Icon.vue'

export interface TabsItem {
    label: string
    value?: string | number
    slot?: string
    content?: string
    disabled?: boolean
    /** A leading icon and a trailing mono count (a total); both are optional. */
    icon?: string
    count?: number | string
}

const props = withDefaults(
    defineProps<{
        items: TabsItem[]
        content?: boolean
        /** `pills` is the phone strip: round chips, no underline. */
        variant?: 'underline' | 'pills'
    }>(),
    { content: true, variant: 'underline' },
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

const TRIGGERS = {
    underline: {
        trigger:
            'px-3 text-13.5 text-fg-3 data-[state=active]:font-semibold data-[state=active]:text-fg-1',
        count: 'text-12 text-fg-faint',
    },
    pills: {
        trigger: 'gap-1.5 rounded-full px-3.5 text-13 text-fg-2 ring-1 ring-stroke-1 ring-inset data-[state=active]:bg-accent-soft data-[state=active]:font-semibold data-[state=active]:text-accent-ink data-[state=active]:ring-transparent',
        count: 'text-12 text-fg-3',
    },
}

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
            class="relative flex w-full max-w-full items-stretch"
            :class="[
                variant === 'pills' ? 'h-9 gap-1.5' : 'h-10.5 gap-0.5 border-stroke-1 border-b',
                overflows && 'overflow-x-auto',
            ]">
            <TabsIndicator v-if="variant === 'underline'" class="indicator absolute" />
            <TabsTrigger
                v-for="(item, index) in items"
                :key="tabValue(item, index)"
                :value="tabValue(item, index)"
                :disabled="item.disabled"
                class="relative z-1 inline-flex shrink-0 items-center gap-1.75 font-medium transition-colors duration-fast hover:not-disabled:text-fg-1 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                :class="TRIGGERS[variant].trigger">
                <slot name="trigger" :item="item" :index="index">
                    <FpIcon
                        v-if="item.icon"
                        :name="item.icon"
                        class="text-15 in-data-[state=active]:text-accent-ink" />
                    {{ item.label }}
                    <span v-if="item.count !== undefined" class="font-mono" :class="TRIGGERS[variant].count">
                        {{ item.count }}
                    </span>
                </slot>
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
