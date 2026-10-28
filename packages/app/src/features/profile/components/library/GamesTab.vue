<script setup lang="ts">
import { FpAsyncView, FpButton, FpEmpty, FpIcon, FpInput, useDesktopLayout } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'
import { useGamesTable } from '../../composables/library/useGamesTable'
import { useLibrary } from '../../composables/library/useLibrary'
import type { ProfileData } from '../../model'
import GamesTable from './GamesTable.vue'

const props = defineProps<{ account: Account; details: ProfileData }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const { library, statusOf, missing } = useLibrary(
    () => props.account,
    () => props.details,
)
const status = statusOf((found) => found.games)
const table = reactive(
    useGamesTable(
        () => props.details,
        library,
        missing,
    ),
)
</script>

<template>
    <div class="flex flex-col gap-u-3">
        <div v-if="status === 'ready'" class="flex flex-wrap items-center gap-2">
            <div class="max-lg:w-full lg:w-70">
                <FpInput v-model="table.query" :size="desktop ? 'sm' : 'md'" :placeholder="t('Search games')">
                    <template #leading><FpIcon name="icon-[lucide--search]" /></template>
                </FpInput>
            </div>
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
                <FpButton
                    v-for="chip in table.filters"
                    :key="chip.value"
                    round
                    :size="desktop ? 'xs' : 'md'"
                    :variant="chip.on ? 'soft' : 'outline'"
                    :color="chip.on ? 'accent' : 'neutral'"
                    class="shrink-0"
                    @click="table.filter = chip.value">
                    {{ chip.label }}
                </FpButton>
                <span class="flex-1" />
                <span v-if="desktop" class="text-12.5 text-fg-3 tabular-nums">{{ table.totals }}</span>
                <template v-else>
                    <FpButton
                        square
                        variant="ghost"
                        size="md"
                        class="shrink-0 text-fg-2!"
                        :aria-label="t('Reverse order')"
                        @click="table.reverse">
                        <FpIcon :name="table.sortIcon" />
                    </FpButton>
                    <FpButton variant="ghost" size="md" class="-ml-1.5 shrink-0 text-fg-2!" @click="table.cycleSort">
                        {{ table.sortLabel }}
                    </FpButton>
                </template>
            </div>
        </div>
        <FpAsyncView :status="status">
            <GamesTable :table="table" :desktop="desktop" />
            <template #empty>
                <FpEmpty :title="table.empty.title" :description="table.empty.description">
                    <template #leading><FpIcon name="icon-[lucide--gamepad-2]" /></template>
                </FpEmpty>
            </template>
        </FpAsyncView>
    </div>
</template>
