<script setup lang="ts">
import {
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuItemIndicator,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from 'reka-ui'
import { computed } from 'vue'
import { type Placement, splitPlacement } from '../../placement'
import Kbd from '../display/Kbd.vue'
import { keyItems } from './dropdownKeys'

export interface DropdownItem {
    /** Identity across renders; defaults to label + description, so rows sharing a label need a key or a description. */
    key?: string
    label: string
    description?: string
    icon?: string
    kbd?: string
    color?: 'danger'
    disabled?: boolean
    /** Makes the item a checkbox item; leave unset for a plain action. */
    checked?: boolean
    onSelect?: () => void
}

export interface DropdownGroup {
    label?: string
    items: DropdownItem[]
}

const props = withDefaults(
    defineProps<{
        items: DropdownItem[] | (DropdownItem[] | DropdownGroup)[]
        placement?: Placement
        sideOffset?: number
        alignOffset?: number
        disabled?: boolean
    }>(),
    { placement: 'bottom-start', sideOffset: 6, alignOffset: 0 },
)

const anchor = computed(() => splitPlacement(props.placement))

const open = defineModel<boolean>('open', { default: false })

const groups = computed<DropdownGroup[]>(() => {
    const first = props.items[0]
    const plain = !first || !(Array.isArray(first) || 'items' in first)
    const all: DropdownGroup[] = plain
        ? [{ items: props.items as DropdownItem[] }]
        : (props.items as (DropdownItem[] | DropdownGroup)[]).map((group) =>
              Array.isArray(group) ? { items: group } : group,
          )
    return all.map((group) => ({ ...group, items: keyItems(group.items) }))
})
</script>

<!-- Portaled menu chrome and motion use global styles. -->
<template>
    <DropdownMenuRoot v-model:open="open">
        <DropdownMenuTrigger as-child :disabled="disabled">
            <slot />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
            <DropdownMenuContent
                :side="anchor.side"
                :align="anchor.align"
                :side-offset="sideOffset"
                :align-offset="alignOffset"
                :collision-padding="8"
                class="fp-float fp-menu surface layer-float min-w-44 rounded">
                <div class="fp-scroll p-1">
                    <template v-for="(group, groupIndex) in groups" :key="groupIndex">
                        <DropdownMenuSeparator v-if="groupIndex > 0" class="-mx-1 my-1 h-px bg-stroke-2" />
                        <component :is="group.label ? DropdownMenuGroup : 'div'" class="contents">
                            <DropdownMenuLabel v-if="group.label" class="eyebrow px-3 pt-1.5 pb-1">
                                {{ group.label }}
                            </DropdownMenuLabel>
                            <component
                                :is="item.checked === undefined ? DropdownMenuItem : DropdownMenuCheckboxItem"
                                v-for="item in group.items"
                                :key="item.key"
                                v-bind="item.checked === undefined ? {} : { modelValue: item.checked }"
                                :disabled="item.disabled"
                                class="touch-row flex cursor-pointer gap-3 rounded px-3 py-1.5 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50"
                                :class="[
                                    item.description ? 'items-start' : 'items-center',
                                    item.color === 'danger'
                                        ? 'text-danger data-highlighted:bg-danger-soft'
                                        : 'text-fg-2 data-highlighted:bg-hover data-highlighted:text-fg-1',
                                ]"
                                @select="item.onSelect?.()">
                                <span v-if="item.checked !== undefined" class="flex w-4 shrink-0 text-accent">
                                    <DropdownMenuItemIndicator class="icon-[lucide--check]" aria-hidden="true" />
                                </span>
                                <span
                                    v-else-if="item.icon"
                                    class="shrink-0"
                                    :class="[item.icon, item.description && 'mt-0.5 text-fg-3']"
                                    aria-hidden="true" />
                                <span v-if="item.description" class="flex min-w-0 flex-1 flex-col">
                                    <span class="truncate text-fg-1">{{ item.label }}</span>
                                    <span class="text-xs text-fg-3">{{ item.description }}</span>
                                </span>
                                <span v-else class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                                <Kbd v-if="item.kbd" :value="item.kbd" class="shrink-0" />
                            </component>
                        </component>
                    </template>
                </div>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
