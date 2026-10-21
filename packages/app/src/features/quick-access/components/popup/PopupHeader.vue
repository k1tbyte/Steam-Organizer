<script setup lang="ts">
import { FpButton, FpDot, FpIcon, FpTooltip } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { useI18n } from 'vue-i18n'

defineProps<{ unlocked: boolean }>()
defineEmits<{ openApp: []; lock: [] }>()

const { t } = useI18n()
</script>

<template>
    <header class="flex h-12 shrink-0 items-center gap-2 border-b border-stroke-1 pr-2 pl-3.5">
        <img :src="logoUrl" alt="" class="size-5" />
        <span class="font-semibold text-13.5 tracking-title text-fg-1">{{ t('Steam Organizer') }}</span>
        <span class="flex-1" />
        <FpTooltip v-if="unlocked" :text="t('Synced')"><FpDot class="mr-1.5" /></FpTooltip>
        <FpTooltip :text="t('Open full app')">
            <FpButton square size="sm" variant="ghost" class="text-fg-3!" :aria-label="t('Open full app')" @click="$emit('openApp')">
                <FpIcon name="icon-[lucide--app-window]" />
            </FpButton>
        </FpTooltip>
        <FpTooltip v-if="unlocked" :text="t('Lock vault')">
            <FpButton square size="sm" variant="ghost" class="text-fg-3!" :aria-label="t('Lock vault')" @click="$emit('lock')">
                <FpIcon name="icon-[lucide--lock]" />
            </FpButton>
        </FpTooltip>
    </header>
</template>
