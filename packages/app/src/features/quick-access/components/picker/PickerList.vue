<script setup lang="ts">
import { type AsyncStatus, FpAsyncView, FpIcon, FpScrollArea } from '@so/ui'
import { computed, toRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import { usePickerRows } from '../../composables/usePickerRows'
import { LIST_INSET_PX, LISTBOX_ID, ROW_PX } from '../../model'

const props = defineProps<{
    rows: Account[]
    revealed: { index: number }
    /** False: the vault is empty, not the search. */
    hasAccounts: boolean
    compact?: boolean
}>()

defineSlots<{
    row(props: { account: Account; index: number }): unknown
}>()

const { t } = useI18n()
const status = computed<AsyncStatus>(() => (props.rows.length > 0 ? 'ready' : 'empty'))
const scroll = useTemplateRef('scroll')
const scroller = computed(() => scroll.value?.viewport ?? null)
const { totalSize, items } = usePickerRows(
    toRef(props, 'rows'),
    scroller,
    toRef(props, 'revealed'),
    computed(() => (props.compact ? ROW_PX.compact : ROW_PX.regular)),
    computed(() => (props.compact ? LIST_INSET_PX.compact : LIST_INSET_PX.regular)),
)
</script>

<!-- The parent sizes the scroller; rows come in the slot. -->
<template>
    <FpScrollArea :id="LISTBOX_ID" ref="scroll" role="listbox" :aria-label="t('Accounts')">
        <FpAsyncView :status class="min-h-full">
            <div
                class="relative shrink-0"
                :class="compact ? 'mx-1' : 'mx-1.5'"
                :style="{ height: `${totalSize}px` }">
                <div
                    v-for="item in items"
                    :key="item.key"
                    class="absolute inset-x-0 top-0"
                    :style="{ transform: `translateY(${item.start}px)` }">
                    <slot name="row" :account="item.account" :index="item.index" />
                </div>
            </div>
            <template #empty>
                <div class="flex flex-col items-center gap-2 py-12 text-13 text-fg-3">
                    <FpIcon
                        class="text-22"
                        :name="hasAccounts ? 'icon-[lucide--search-x]' : 'icon-[lucide--user-round-plus]'" />
                    {{ hasAccounts ? t('No accounts match') : t('No accounts in this vault yet') }}
                </div>
            </template>
        </FpAsyncView>
    </FpScrollArea>
</template>
