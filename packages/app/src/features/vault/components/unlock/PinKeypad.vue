<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ hasBio: boolean; waiting: boolean }>()
defineEmits<{ digit: [digit: string]; delete: []; bio: [] }>()

const { t } = useI18n()
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const KEY =
    'surface grid size-19 place-items-center rounded-full text-26 font-medium text-fg-1 transition-colors duration-press active:bg-surface-hi'
</script>

<template>
    <div class="grid grid-cols-[repeat(3,4.75rem)] justify-center gap-x-6.5 gap-y-3.5">
        <button
            v-for="digit in DIGITS"
            :key="digit"
            type="button"
            :class="KEY"
            @click="$emit('digit', digit)">
            {{ digit }}
        </button>
        <button
            v-if="hasBio"
            type="button"
            class="grid size-19 place-items-center rounded-full text-28 text-accent-ink transition-colors duration-fast"
            :class="waiting && 'bg-accent-soft'"
            :aria-label="t('Unlock with Windows Hello')"
            @click="$emit('bio')">
            <FpIcon name="icon-[lucide--fingerprint]" />
        </button>
        <span v-else />
        <button type="button" :class="KEY" @click="$emit('digit', '0')">0</button>
        <button
            type="button"
            class="grid size-19 place-items-center rounded-full text-22 text-fg-2"
            :aria-label="t('Delete')"
            @click="$emit('delete')">
            <FpIcon name="icon-[lucide--delete]" />
        </button>
    </div>
</template>
