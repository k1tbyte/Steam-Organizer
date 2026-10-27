<script setup lang="ts">
import { FpContextMenu } from '@so/ui'
import { reactive, toRef, useTemplateRef } from 'vue'

import { useAccountMenu } from '../../composables/list/useAccountMenu'
import { useAccountRows } from '../../composables/list/useAccountRows'
import { useCardTagPicker } from '../../composables/list/useCardTagPicker'
import { useUnlockDialog } from '../../composables/list/useUnlockDialog'
import type { Account } from '../../model'
import AccountCard from '../card/AccountCard.vue'
import UnlockAccountDialog from '../lock/UnlockAccountDialog.vue'
import AccountTagPicker from '../tags/AccountTagPicker.vue'
import AccountsGroupHeading from './AccountsGroupHeading.vue'

const props = defineProps<{ pinned: Account[]; rest: Account[] }>()
const emit = defineEmits<{
    togglePin: [id: string]
    /** The menu's Delete, which asks first. */
    delete: [id: string]
    /** The card's trash, which leaves Undo instead. */
    deleteNow: [id: string]
}>()

const list = useTemplateRef('list')
const grid = useAccountRows(
    { pinned: toRef(props, 'pinned'), rest: toRef(props, 'rest') },
    list,
)
const tagging = useCardTagPicker()
const unlocking = reactive(useUnlockDialog())
const menu = useAccountMenu({
    togglePin: (id) => emit('togglePin', id),
    editTags: tagging.show,
    delete: (id) => emit('delete', id),
    unlock: unlocking.show,
})
</script>

<!-- Only the rows near the viewport render, each at its offset in the shell's scroller. Rows key by slot and cards by
     column: a row that scrolls in takes the nodes of one that left, patched with its accounts. One context menu serves
     every card, one tag picker every card's tags. -->
<template>
    <div class="px-u-6 pb-u-6 max-lg:px-4 max-lg:pb-4">
        <FpContextMenu
            v-model:open="menu.open.value"
            :items="menu.items.value"
            :accept="menu.accept"
            @close-auto-focus="menu.closeAutoFocus">
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
                            @edit-tags="tagging.show"
                            @delete="emit('deleteNow', account.id)" />
                    </div>
                </div>
            </div>
        </FpContextMenu>
        <AccountTagPicker v-model:open="tagging.open.value" :anchor="tagging.anchor.value" :account="tagging.account.value" />
        <UnlockAccountDialog :dialog="unlocking" />
    </div>
</template>
