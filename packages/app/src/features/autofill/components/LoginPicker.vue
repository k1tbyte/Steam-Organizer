<script setup lang="ts">
import { FpButton, FpIcon, FpInput, FpKbd } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'
import { LISTBOX_ID, PickerList, PickerRow } from '#features/quick-access'

import { useLoginPicker } from '../composables/useLoginPicker'
import LockedNotice from './LockedNotice.vue'

const emit = defineEmits<{ fill: [account: Account]; close: [] }>()

const { t } = useI18n()
const {
    query,
    rows,
    index,
    activeId,
    revealed,
    hasAccounts,
    select,
    choose,
    notice,
    openApp,
    onKeydown,
} = useLoginPicker({
    fill: (account) => emit('fill', account),
    close: () => emit('close'),
})

const search = useTemplateRef('search')
onMounted(() => search.value?.focus())
</script>

<template>
    <div
        role="dialog"
        :aria-label="t('Steam Organizer')"
        class="surface-float pointer-events-auto fixed flex w-85 flex-col"
        @keydown="onKeydown">
        <header class="flex items-center gap-2 border-b border-stroke-1 py-2 pr-2 pl-2.5">
            <img :src="logoUrl" alt="" class="size-4" />
            <div
                v-if="!notice"
                class="flex h-7.5 min-w-0 flex-1 items-center rounded bg-surface-hi px-2 text-13">
                <!-- biome-ignore lint/a11y/useAriaActivedescendantWithTabindex: FpInput renders a native, tabbable input -->
                <FpInput
                    ref="search"
                    v-model="query"
                    bare
                    role="combobox"
                    :aria-label="t('Search accounts')"
                    :aria-controls="LISTBOX_ID"
                    :aria-activedescendant="activeId"
                    :aria-expanded="true"
                    :placeholder="t('Search accounts')">
                    <template #leading><FpIcon name="icon-[lucide--search]" class="text-13" /></template>
                </FpInput>
            </div>
            <span v-else class="flex-1 font-semibold text-13 text-fg-1">{{ t('Steam Organizer') }}</span>
            <FpButton square size="sm" variant="ghost" class="text-fg-3!" :aria-label="t('Close')" @click="$emit('close')">
                <FpIcon name="icon-[lucide--x]" />
            </FpButton>
        </header>
        <LockedNotice
            v-if="notice"
            :title="notice.title"
            :hint="notice.hint"
            :action="notice.action"
            @open="openApp" />
        <template v-else>
            <PickerList compact class="max-h-48.75" :rows :revealed :has-accounts="hasAccounts">
                <template #row="{ account, index: at }">
                    <PickerRow
                        compact
                        :account
                        :selected="at === index"
                        :concealed="account.locked"
                        @hover="select(at)"
                        @choose="choose(account)">
                        <FpIcon
                            v-if="account.guard"
                            name="icon-[lucide--shield-check]"
                            role="img"
                            :aria-label="t('Steam Guard code will be filled too')"
                            class="shrink-0 text-14 text-accent-ink" />
                        <FpKbd v-if="at === index" value="↵" class="px-1.25!" />
                    </PickerRow>
                </template>
            </PickerList>
            <footer class="flex items-center gap-1.5 border-t border-stroke-1 px-3 py-2 text-11.5 text-fg-3">
                <FpIcon name="icon-[lucide--shield-check]" class="text-12" />
                {{ t('Fills login and password, then the Steam Guard code') }}
            </footer>
        </template>
    </div>
</template>
