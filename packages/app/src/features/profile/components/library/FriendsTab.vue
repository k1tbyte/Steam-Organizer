<script setup lang="ts">
import { FpAsyncView, FpButton, FpDropdownMenu, FpEmpty, FpIcon, FpInput, useDesktopLayout } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'
import { useFriendsList } from '../../composables/library/useFriendsList'
import { useLibrary } from '../../composables/library/useLibrary'
import type { ProfileData } from '../../model'
import FriendsGrid from './FriendsGrid.vue'

const props = defineProps<{ account: Account; details: ProfileData }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const { library, statusOf, missing } = useLibrary(
    () => props.account,
    () => props.details,
)
const status = statusOf((found) => found.friends)
const list = reactive(useFriendsList(library, missing))
</script>

<template>
    <div class="flex flex-col gap-u-3">
        <div v-if="status === 'ready'" class="flex flex-wrap items-center gap-2">
            <div class="max-lg:w-full lg:w-70">
                <FpInput v-model="list.query" :size="desktop ? 'sm' : 'md'" :placeholder="t('Search friends')">
                    <template #leading><FpIcon name="icon-[lucide--search]" /></template>
                </FpInput>
            </div>
            <div class="flex min-w-0 flex-1 items-center gap-1.5">
                <FpButton
                    v-for="chip in list.filters"
                    :key="chip.value"
                    round
                    :size="desktop ? 'xs' : 'md'"
                    :variant="chip.on ? 'soft' : 'outline'"
                    :color="chip.on ? 'accent' : 'neutral'"
                    class="shrink-0"
                    @click="list.filter = chip.value">
                    {{ chip.label }}
                </FpButton>
                <span class="flex-1" />
                <FpDropdownMenu v-if="desktop" :items="list.sortItems" placement="bottom-end" width="12rem">
                    <FpButton variant="ghost" size="sm" class="shrink-0 text-fg-2!">
                        <FpIcon name="icon-[lucide--arrow-down-up]" />
                        {{ list.sortLabel }}
                        <FpIcon name="icon-[lucide--chevron-down]" />
                    </FpButton>
                </FpDropdownMenu>
                <FpButton v-else variant="ghost" size="md" class="shrink-0 text-fg-2!" @click="list.cycleSort">
                    <FpIcon name="icon-[lucide--arrow-down-up]" />
                    {{ list.sortLabel }}
                </FpButton>
            </div>
        </div>
        <FpAsyncView :status="status">
            <FriendsGrid :list="list" :desktop="desktop" />
            <template #empty>
                <FpEmpty :title="list.empty.title" :description="list.empty.description">
                    <template #leading><FpIcon name="icon-[lucide--users]" /></template>
                </FpEmpty>
            </template>
        </FpAsyncView>
    </div>
</template>
