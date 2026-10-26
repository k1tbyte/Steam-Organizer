<script setup lang="ts">
import { FpButton, FpModal } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { RemoveAccountsState } from '../../composables/useRemoveAccounts'
import LevelAvatar from '../card/LevelAvatar.vue'

defineProps<{ removal: RemoveAccountsState }>()

const { t } = useI18n()
</script>

<!-- One account shows its Steam side under the name; a batch lists the first few and counts the rest. -->
<template>
    <FpModal v-model:open="removal.open" :title="removal.title" width="min(92vw, 26rem)">
        <ul class="flex flex-col rounded bg-surface-hi" :class="removal.single ? 'p-3' : 'gap-1 p-2'">
            <li v-for="row in removal.rows" :key="row.id" class="flex min-w-0 items-center gap-3" :class="!removal.single && 'p-1'">
                <LevelAvatar
                    :name="row.nickname"
                    :hue="row.hue"
                    :level="row.level"
                    :anonymous="row.anonymous"
                    :size="removal.single ? 'sm' : 'xs'" />
                <span v-if="removal.single" class="flex min-w-0 flex-col gap-0.5">
                    <span class="truncate font-semibold text-14 text-fg-1">{{ row.nickname }}</span>
                    <span v-if="row.detail" class="truncate font-mono text-12 text-fg-3">{{ row.detail }}</span>
                </span>
                <span v-else class="flex min-w-0 items-baseline gap-2">
                    <span class="min-w-0 truncate font-medium text-14 text-fg-1">{{ row.nickname }}</span>
                    <span v-if="row.steamName" class="min-w-0 shrink-[4] truncate text-12.5 text-fg-3">{{ row.steamName }}</span>
                </span>
            </li>
            <li v-if="removal.more" class="py-1 pl-10 text-12.5 text-fg-3">
                {{ t('and {count} more', { count: removal.more }) }}
            </li>
        </ul>
        <p class="mt-3.5 text-13 text-fg-3 leading-snug">{{ removal.note }}</p>
        <template #footer>
            <FpButton variant="ghost" :label="t('Cancel')" @click="removal.open = false" />
            <FpButton color="danger" :label="removal.confirmLabel" @click="removal.confirm" />
        </template>
    </FpModal>
</template>
