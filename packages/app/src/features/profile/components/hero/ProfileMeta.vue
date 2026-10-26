<script setup lang="ts">
import type { ProfileHeaderState } from '../../composables/hero/useProfileHeader'

defineProps<{ meta: ProfileHeaderState['meta']; touch: boolean }>()
</script>

<template>
    <dl class="min-w-0" :class="touch ? 'grid grid-cols-3 gap-2 px-0.5 py-1' : 'flex items-center gap-u-8'">
        <div v-for="item in meta" :key="item.label" class="flex min-w-0 flex-col gap-0.5">
            <dt class="text-11.5 text-fg-3">{{ item.label }}</dt>
            <dd class="text-13 text-fg-1 tabular-nums" :class="touch && 'truncate'">
                {{ touch ? item.short : item.value }}
            </dd>
        </div>
    </dl>
</template>
