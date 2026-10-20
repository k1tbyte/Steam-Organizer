<script setup lang="ts">
import { ref, watch } from 'vue'

import { useTimer } from '../../composables/useTimer'
import FpButton from '../buttons/Button.vue'
import FpIcon from '../display/media/Icon.vue'
import FpEmpty from './Empty.vue'
import FpSpinner from './Spinner.vue'

export type AsyncStatus = 'loading' | 'ready' | 'empty' | 'error'

// Fast loads swap straight to content instead of flashing a spinner.
const LOADER_DELAY_MS = 200

defineOptions({ inheritAttrs: false })

const props = defineProps<{
    status: AsyncStatus
    /** Copy for the default error state; the caller translates it. */
    errorTitle?: string
    errorDescription?: string
    retryLabel?: string
}>()

const emit = defineEmits<{ retry: [] }>()

defineSlots<{
    default(): unknown
    /** `delayed`: the loading has outlasted the flash threshold, so a loader may show. */
    loading?(props: { delayed: boolean }): unknown
    empty?(): unknown
    error?(): unknown
}>()

const loaderVisible = ref(false)
const timer = useTimer()

watch(
    () => props.status,
    (status) => {
        timer.cancel()
        loaderVisible.value = false
        if (status === 'loading') timer.arm(LOADER_DELAY_MS, () => (loaderVisible.value = true))
    },
    { immediate: true },
)
</script>

<!-- Dependent UI mounts only when ready; attrs size the status area, not the content. -->
<template>
    <slot v-if="status === 'ready'" />
    <div
        v-else
        v-bind="$attrs"
        class="flex flex-col"
        :aria-busy="status === 'loading' || undefined">
        <slot v-if="status === 'loading'" name="loading" :delayed="loaderVisible">
            <FpSpinner v-if="loaderVisible" size="lg" class="m-auto text-fg-3" />
        </slot>
        <slot v-else-if="status === 'empty'" name="empty" />
        <slot v-else name="error">
            <FpEmpty class="m-auto" role="alert" :title="errorTitle" :description="errorDescription">
                <template #leading>
                    <FpIcon name="icon-[lucide--triangle-alert]" />
                </template>
                <template v-if="retryLabel" #actions>
                    <FpButton variant="soft" color="neutral" :label="retryLabel" @click="emit('retry')" />
                </template>
            </FpEmpty>
        </slot>
    </div>
</template>
