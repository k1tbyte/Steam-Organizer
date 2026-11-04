<script setup lang="ts">
import { FpIcon, FpInput, FpKbd, FpOptionRow } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { TagSearchState } from '../../composables/tags/useTagSearch'
import TagSwatches from './TagSwatches.vue'

defineProps<{ search: TagSearchState }>()
const emit = defineEmits<{ submit: []; create: [] }>()

const { t } = useI18n()
</script>

<!-- A tag picker's frame: the search, the caller's rows, and the create row with its swatches while the label is new. -->
<template>
    <div class="flex min-h-0 flex-col">
        <div class="flex h-10 items-center border-b border-stroke-1 px-3">
            <FpInput
                v-model="search.query"
                bare
                size="sm"
                data-autofocus
                :placeholder="t('Find or create a tag')"
                :aria-label="t('Find or create a tag')"
                @submit="emit('submit')">
                <template #leading>
                    <FpIcon name="icon-[lucide--search]" class="text-14" />
                </template>
            </FpInput>
        </div>
        <div v-if="search.found.length > 0" class="flex flex-col gap-px p-1.5">
            <slot />
        </div>
        <div v-if="search.fresh" class="flex flex-col gap-2.5 border-t border-stroke-1 px-3.5 pt-2 pb-3">
            <FpOptionRow class="-mx-1.5 gap-2! px-1.5!" @click="emit('create')">
                <FpIcon name="icon-[lucide--plus]" class="text-14 text-accent-ink" />
                <span class="min-w-0 flex-1 truncate">{{ t('Create “{label}”', { label: search.fresh }) }}</span>
                <FpKbd value="Enter" />
            </FpOptionRow>
            <TagSwatches :swatches="search.swatches" @pick="search.pick" />
        </div>
    </div>
</template>
