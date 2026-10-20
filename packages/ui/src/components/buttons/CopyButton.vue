<script setup lang="ts">
import { computed, ref } from 'vue'

import { useTimer } from '../../composables/useTimer'
import FpIcon from '../display/media/Icon.vue'
import FpButton from './Button.vue'

type Result = 'idle' | 'copied' | 'failed'

const RESULT_MS = 2000
const ICONS: Record<Result, string> = {
    idle: 'icon-[lucide--copy]',
    copied: 'icon-[lucide--check]',
    failed: 'icon-[lucide--circle-alert]',
}
const TONES: Record<Result, string> = { idle: '', copied: 'text-success', failed: 'text-danger' }

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        value: string
        label?: string
        copiedLabel?: string
        failedLabel?: string
        iconOnly?: boolean
    }>(),
    { iconOnly: false },
)

const result = ref<Result>('idle')
const timer = useTimer()

const text = computed(
    () =>
        ({
            idle: props.label ?? 'Copy',
            copied: props.copiedLabel ?? 'Copied',
            failed: props.failedLabel ?? 'Copy failed',
        })[result.value],
)

async function copy() {
    if (result.value !== 'idle') return
    try {
        await navigator.clipboard.writeText(props.value)
        result.value = 'copied'
    } catch {
        result.value = 'failed'
    }
    timer.arm(RESULT_MS, () => {
        result.value = 'idle'
    })
}
</script>

<template>
    <FpButton v-bind="$attrs" :aria-label="iconOnly ? text : undefined" @click="copy">
        <FpIcon
            :key="result"
            :name="ICONS[result]"
            :class="[iconOnly ? 'text-17' : 'text-15', TONES[result], result !== 'idle' && 'animate-pop']" />
        <span v-if="!iconOnly">{{ text }}</span>
        <span class="sr-only" aria-live="polite">{{ result === 'idle' ? '' : text }}</span>
    </FpButton>
</template>
