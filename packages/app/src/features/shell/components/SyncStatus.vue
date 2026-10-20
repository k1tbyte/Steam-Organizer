<script setup lang="ts">
import { useSyncStatus } from '../composables/useSyncStatus'
import type { SyncState } from '../model'

const status = useSyncStatus()

const DOTS: Record<SyncState, string> = {
    synced: 'bg-success',
    syncing: 'bg-accent',
    error: 'bg-danger',
    offline: 'bg-fg-faint',
}
</script>

<!-- The phone header has room for the age; the desktop topbar shows the state alone. -->
<template>
    <span
        v-if="status"
        class="flex items-center gap-1.5 text-11.5 text-fg-3 lg:text-12.5">
        <span class="size-1.5 rounded-full lg:size-1.75" :class="DOTS[status.state]" />
        <span class="flex gap-1">
            <span>{{ status.label }}</span>
            <span v-if="status.age" class="lg:hidden">{{ status.age }}</span>
        </span>
    </span>
</template>
