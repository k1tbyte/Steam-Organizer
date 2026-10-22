<script setup lang="ts">
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuItemIndicator,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from 'reka-ui'
import FpIcon from '../display/media/Icon.vue'
import type { MenuGroup } from './menu'

defineProps<{ groups: MenuGroup[] }>()
</script>

<!-- Reka's ContextMenu* item parts are the same thin Menu* wrappers as these DropdownMenu* ones, so both menus
     render this list (reka 2.11: recheck on an upgrade). -->
<template>
    <div class="flex flex-col gap-px p-1">
        <template v-for="(group, groupIndex) in groups" :key="groupIndex">
            <DropdownMenuSeparator v-if="groupIndex > 0" class="mx-1.5 my-1 h-px shrink-0 bg-stroke-1" />
            <DropdownMenuLabel v-if="group.label" class="eyebrow px-2.5 pt-1.5 pb-1">{{ group.label }}</DropdownMenuLabel>
            <component
                :is="group.choice ? DropdownMenuRadioGroup : group.label ? DropdownMenuGroup : 'div'"
                v-bind="group.choice && { modelValue: group.value }"
                :class="
                    group.choice === 'segmented'
                        ? 'mx-1 mb-0.5 flex gap-0.5 rounded-sm bg-surface-hi p-0.5'
                        : 'contents'
                ">
                <component
                    :is="group.choice ? DropdownMenuRadioItem : DropdownMenuItem"
                    v-for="item in group.items"
                    :key="item.key"
                    v-bind="group.choice && { value: item.key }"
                    :disabled="item.disabled"
                    class="cursor-pointer outline-none data-disabled:pointer-events-none data-disabled:opacity-50"
                    :class="
                        group.choice === 'segmented'
                            ? 'flex h-6.5 min-w-0 flex-1 items-center justify-center gap-1.25 rounded-xs text-12 text-fg-3 data-[state=checked]:bg-surface-pop data-[state=checked]:text-fg-1 data-[state=checked]:shadow-thumb data-[state=unchecked]:data-highlighted:bg-hover'
                            : [
                                  'touch-row flex min-h-8 gap-2.5 rounded-sm px-2.5 py-1 text-13 data-highlighted:bg-hover',
                                  item.description ? 'items-start' : 'items-center',
                                  item.color === 'danger' ? 'text-danger' : 'text-fg-1',
                              ]
                    "
                    @select="item.onSelect?.()">
                    <template v-if="group.choice === 'segmented'">
                        <FpIcon v-if="item.icon" :name="item.icon" class="shrink-0" />
                        <span class="truncate">{{ item.label }}</span>
                    </template>
                    <template v-else>
                        <FpIcon
                            v-if="item.icon"
                            :name="item.icon"
                            class="shrink-0 text-15"
                            :class="[item.color !== 'danger' && 'text-fg-3', item.description && 'mt-0.5']" />
                        <span v-if="item.description" class="flex min-w-0 flex-1 flex-col">
                            <span class="truncate">{{ item.label }}</span>
                            <span class="text-12 text-fg-3">{{ item.description }}</span>
                        </span>
                        <span v-else class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                        <DropdownMenuItemIndicator v-if="group.choice" as-child>
                            <FpIcon name="icon-[lucide--check]" class="shrink-0 text-14 text-accent-ink" />
                        </DropdownMenuItemIndicator>
                    </template>
                </component>
            </component>
        </template>
    </div>
</template>

