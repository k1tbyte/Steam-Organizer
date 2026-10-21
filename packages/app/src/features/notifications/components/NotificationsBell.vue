<script setup lang="ts">
import {
    FpButton,
    FpChip,
    FpDot,
    FpEmpty,
    FpIcon,
    FpIconTile,
    FpPopover,
    FpTooltip,
    useDesktopLayout,
} from '@so/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useNotifications } from '../composables/useNotifications'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { items, unread, badge, markAllRead } = useNotifications()
const open = ref(false)
</script>

<template>
    <FpPopover
        v-model:open="open"
        sheet
        :padded="false"
        placement="bottom-end"
        width="min(92vw, 22.5rem)"
        max-height="min(34rem, 80dvh)"
        :label="t('Notifications')">
        <FpTooltip :text="t('Notifications')" :disabled="open">
            <FpButton
                square
                variant="ghost"
                :size="desktop ? 'md' : 'xl'"
                :round="!desktop"
                :class="open && 'bg-hover-hi!'"
                :aria-label="
                    unread > 0
                        ? t('Notifications, {count} unread', { count: unread })
                        : t('Notifications')
                ">
                <FpChip :show="unread > 0" :text="badge" color="danger">
                    <FpIcon name="icon-[lucide--bell]" />
                </FpChip>
            </FpButton>
        </FpTooltip>

        <template #content>
            <div class="flex items-center gap-2 pt-3.5 pr-3.5 pb-2 pl-4">
                <span class="flex-1 font-semibold text-14 text-fg-1">
                    {{ t('Notifications') }}
                </span>
                <FpButton
                    size="xs"
                    variant="ghost"
                    :disabled="unread === 0"
                    @click="markAllRead">
                    {{ t('Mark all read') }}
                </FpButton>
            </div>
            <ul v-if="items.length > 0" class="flex flex-col px-1.5 pb-1.5">
                <li
                    v-for="item in items"
                    :key="item.id"
                    class="flex items-start gap-3 rounded p-2.5 transition-colors duration-fast hover:bg-hover">
                    <FpIconTile :name="item.icon" :color="item.tone" size="sm" />
                    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span class="font-medium text-13.5 text-fg-1">{{ item.title }}</span>
                        <span class="text-12.5 text-fg-3">{{ item.body }}</span>
                    </span>
                    <span class="flex shrink-0 items-center gap-1.5 text-12 text-fg-3">
                        {{ item.time }}
                        <FpDot size="md" color="accent" :class="!item.unread && 'invisible'" />
                    </span>
                </li>
            </ul>
            <FpEmpty v-else :title="t('You are all caught up')" />
        </template>
    </FpPopover>
</template>
