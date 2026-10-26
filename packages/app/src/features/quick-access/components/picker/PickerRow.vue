<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { computed } from 'vue'

import { type Account, LevelAvatar } from '#features/accounts'

import { optionId, ROW_PX, SECRET_MASK } from '../../model'

const props = defineProps<{
    account: Account
    selected: boolean
    /** A locked account's login stays hidden. */
    concealed: boolean
    /** The injected picker's shorter row. */
    compact?: boolean
}>()

defineEmits<{ hover: []; choose: [] }>()

const height = computed(() => `${props.compact ? ROW_PX.compact : ROW_PX.regular}px`)
// An empty login is one the vault keeps secret.
const login = computed(() =>
    props.concealed || !props.account.login ? SECRET_MASK : props.account.login,
)
</script>

<!-- Trailing controls come in the slot: the popup adds actions, the injected picker a fill hint. -->
<template>
    <!-- biome-ignore lint/a11y/useKeyWithClickEvents: the search field owns the keyboard; a row only answers the pointer -->
    <div
        :id="optionId(account.id)"
        role="option"
        tabindex="-1"
        :aria-selected="selected"
        class="flex shrink-0 cursor-pointer items-center gap-2.5 rounded px-2 transition-colors duration-fast"
        :class="selected && 'bg-hover-hi'"
        :style="{ height }"
        @mousemove="$emit('hover')"
        @click="$emit('choose')">
        <LevelAvatar
            ring
            size="sm"
            :name="account.nickname"
            :hue="account.hue"
            :level="account.level"
            :anonymous="account.anonymous"
            :class="compact ? 'size-8!' : 'size-9!'" />
        <span class="flex min-w-0 flex-1 flex-col gap-px">
            <span class="flex min-w-0 items-center gap-1.25">
                <span class="truncate font-semibold text-13.5 text-fg-1">{{ account.nickname }}</span>
                <FpIcon v-if="account.pinned" name="icon-[lucide--pin]" class="shrink-0 text-11 text-accent-ink" />
                <FpIcon v-if="account.locked" name="icon-[lucide--lock]" class="shrink-0 text-11 text-fg-3" />
            </span>
            <span class="truncate font-mono text-11.5 text-fg-3">{{ login }}</span>
        </span>
        <slot />
    </div>
</template>
