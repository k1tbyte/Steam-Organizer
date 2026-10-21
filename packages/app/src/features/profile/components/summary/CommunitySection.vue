<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { useCommunity } from '../../composables/useCommunity'
import type { ProfileData } from '../../model'
import CollapsibleSection from './CollapsibleSection.vue'

const props = defineProps<{ details: ProfileData }>()

const { t } = useI18n()
const { tiles } = useCommunity(() => props.details)
</script>

<template>
    <CollapsibleSection section="community" :title="t('Community')" icon="icon-[lucide--trophy]">
        <div class="grid grid-cols-2 gap-1.5 px-2.5 pb-2.5 lg:px-3 lg:pb-3">
            <div v-for="tile in tiles" :key="tile.label" class="flex min-w-0 flex-col gap-1 rounded bg-surface-hi px-3 pt-3 pb-2.75">
                <span class="truncate text-12 text-fg-3">{{ tile.label }}</span>
                <span
                    class="font-mono font-semibold text-19 tracking-[-0.02em] max-lg:text-15.5"
                    :class="tile.accent ? 'text-accent-ink' : 'text-fg-1'">
                    {{ tile.value }}
                </span>
                <span class="truncate text-12 text-fg-3">{{ tile.sub }}</span>
                <span v-if="tile.bar !== undefined" class="mt-1 block h-1 overflow-hidden rounded-full bg-stroke-1">
                    <span class="block h-full rounded-full bg-accent" :style="{ width: `${tile.bar}%` }" />
                </span>
            </div>
        </div>
    </CollapsibleSection>
</template>
