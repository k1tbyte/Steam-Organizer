<script setup lang="ts">
import { FpCountdownRing, FpIcon, FpTooltip } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useGuardCode } from '#features/steam-guard'

const props = defineProps<{
    /** Account id: the demo code is derived from it. */
    seed: string
    /** A locked account's code stays masked until its password is given. */
    locked: boolean
}>()

defineEmits<{ unlock: [] }>()

const { t } = useI18n()
const { holding, handlers, shown, remaining } = useGuardCode(() => props.seed)
const press = computed(() => (props.locked ? {} : handlers))
const hint = computed(() =>
    props.locked ? t('Unlock to use the Steam Guard code') : t('Hold to show the Steam Guard code'),
)
</script>

<template>
    <FpTooltip :text="hint">
        <button
            type="button"
            v-bind="press"
            :aria-label="hint"
            class="flex h-7 shrink-0 cursor-pointer touch-none items-center gap-1.5 rounded pr-2 pl-1.5 text-fg-1 transition-colors duration-fast select-none"
            :class="holding ? 'bg-accent-soft' : 'bg-surface-hi'"
            @click="locked && $emit('unlock')">
            <FpIcon v-if="locked" name="icon-[lucide--lock]" class="text-12 text-fg-3" />
            <FpCountdownRing v-else :value="remaining" :size="12" />
            <span class="w-12 text-left font-mono font-semibold text-12.5 tracking-[0.1em]">{{ shown }}</span>
        </button>
    </FpTooltip>
</template>
