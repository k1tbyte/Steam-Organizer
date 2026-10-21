<script setup lang="ts">
import { FpButton, FpCountdownRing, FpIcon } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'
import { GUARD_PERIOD_S, useGuardCode } from '#features/steam-guard'

const props = defineProps<{
    account?: Account
    filled: boolean
    /** Set when the code cannot be filled: what blocks it and the button that fixes it. */
    notice?: { title: string; action: string }
}>()

const emit = defineEmits<{ fill: [code: string]; unlock: []; dismiss: [] }>()

const { t } = useI18n()
const { remaining, currentCode } = useGuardCode(
    () => props.account?.id ?? '',
)
const seconds = computed(() => Math.round(remaining.value * GUARD_PERIOD_S))
</script>

<template>
    <div
        role="dialog"
        :aria-label="t('Steam Guard code')"
        class="surface-float pointer-events-auto fixed flex min-w-87 items-center justify-center gap-2.5 py-1.5 pr-1.5 pl-2 whitespace-nowrap">
        <img :src="logoUrl" alt="" class="ml-0.5 size-4.5" />
        <template v-if="notice">
            <span class="font-semibold text-13 text-fg-1">{{ notice.title }}</span>
            <FpButton color="accent" size="sm" @click="$emit('unlock')">{{ notice.action }}</FpButton>
        </template>
        <template v-else>
            <span class="text-13 text-fg-3">{{ t('Code for') }}</span>
            <span class="font-semibold text-13 text-fg-1">{{ account?.nickname }}</span>
            <span class="h-4.5 w-px bg-stroke-2" />
            <FpCountdownRing :value="remaining" :size="14" />
            <span class="font-mono text-12 text-fg-3">{{ t('{seconds}s', { seconds }) }}</span>
            <FpButton color="accent" size="sm" @click="emit('fill', currentCode())">
                <FpIcon v-if="filled" name="icon-[lucide--check]" />
                {{ filled ? t('Filled') : t('Fill code') }}
            </FpButton>
        </template>
        <FpButton square size="sm" variant="ghost" class="text-fg-3!" :aria-label="t('Dismiss')" @click="$emit('dismiss')">
            <FpIcon name="icon-[lucide--x]" />
        </FpButton>
    </div>
</template>
