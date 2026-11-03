<script setup lang="ts">
import { FpCard, FpSkeleton } from '@so/ui'

import { useListSkeleton } from '../../composables/list/useListSkeleton'

const view = useListSkeleton()
</script>

<!-- The card's frame and header at the card's height, in the grid's columns: the list replaces it in place. -->
<template>
    <div class="px-u-6 pb-u-6 pt-u-2 max-lg:px-4 max-lg:pb-4">
        <div class="grid items-start" :style="view.gridStyle.value">
            <FpCard v-for="card in view.cards.value" :key="card" flush class="p-u-3.5" :style="{ height: view.cardHeight.value }">
                <div class="flex h-13.5 items-center gap-u-3.5">
                    <FpSkeleton class="size-13.5 shrink-0 rounded" />
                    <div class="flex min-w-0 flex-1 flex-col gap-2">
                        <FpSkeleton class="h-3.5 w-2/5 rounded" />
                        <FpSkeleton class="h-3 w-1/4 rounded" />
                    </div>
                </div>
            </FpCard>
        </div>
    </div>
</template>
