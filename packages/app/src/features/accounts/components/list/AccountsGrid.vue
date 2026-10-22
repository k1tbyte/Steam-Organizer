<script setup lang="ts">
import { toRef, useTemplateRef } from 'vue'

import { useAccountRows } from '../../composables/useAccountRows'
import type { Account } from '../../model'
import AccountCard from '../card/AccountCard.vue'
import AccountsGroupHeading from './AccountsGroupHeading.vue'

const props = defineProps<{ pinned: Account[]; rest: Account[] }>()
const emit = defineEmits<{
    togglePin: [id: string]
    editTags: [id: string]
    delete: [id: string]
}>()

const list = useTemplateRef('list')
const grid = useAccountRows(
    { pinned: toRef(props, 'pinned'), rest: toRef(props, 'rest') },
    list,
)
</script>

<!-- Only the rows near the viewport render, each at its offset in the shell's scroller. Rows key by slot and cards by
     column: a row that scrolls in takes the nodes of one that left, patched with its accounts. -->
<template>
    <div class="px-u-6 pb-u-6 max-lg:px-4 max-lg:pb-4">
        <div ref="list" class="relative" :style="{ height: `${grid.totalSize.value}px` }">
            <div
                v-for="item in grid.items.value"
                :key="item.slot"
                class="absolute inset-x-0 top-0"
                :class="item.row.kind === 'heading' && item.row.spaced && 'pt-u-2'"
                :style="{
                    height: `${item.size}px`,
                    transform: `translateY(${item.start - grid.margin.value}px)`,
                }">
                <AccountsGroupHeading v-if="item.row.kind === 'heading'" :group="item.row.key" />
                <div v-else class="grid items-start" :style="grid.rowStyle.value">
                    <AccountCard
                        v-for="(account, column) in item.row.accounts"
                        :key="column"
                        :account="account"
                        :flags="grid.flags.value"
                        :touch="grid.touch.value"
                        @toggle-pin="emit('togglePin', account.id)"
                        @edit-tags="emit('editTags', account.id)"
                        @delete="emit('delete', account.id)" />
                </div>
            </div>
        </div>
    </div>
</template>
