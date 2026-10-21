<script setup lang="ts">
import { FpIcon, FpInput } from '@so/ui'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useQuickAccess } from '../../composables/useQuickAccess'
import { LISTBOX_ID } from '../../model'
import PickerList from '../picker/PickerList.vue'
import AccountPrompt from './AccountPrompt.vue'
import FillBanner from './FillBanner.vue'
import PopupFooter from './PopupFooter.vue'
import PopupRow from './PopupRow.vue'

const { t } = useI18n()
const {
    query,
    rows,
    index,
    activeId,
    revealed,
    hasAccounts,
    countLabel,
    select,
    banner,
    hasBanner,
    canFill,
    fillLabel,
    filled,
    fill,
    copyLogin,
    copyPassword,
    isCopied,
    openInApp,
    onKeydown,
    asking,
    password,
    passwordError,
    isConcealed,
    unlock,
    submitPassword,
    cancelPassword,
} = useQuickAccess()

// The popup is a palette: typing starts the moment it opens.
const search = useTemplateRef('search')
onMounted(() => search.value?.focus())
</script>

<template>
    <!-- biome-ignore lint/a11y/noStaticElementInteractions: keys bubble up from the search field and the rows -->
    <div class="flex min-h-0 flex-1 flex-col" @keydown="onKeydown">
        <div class="shrink-0 px-2.5 pt-2.5 pb-2">
            <!-- biome-ignore lint/a11y/useAriaActivedescendantWithTabindex: FpInput renders a native, tabbable input -->
            <FpInput
                ref="search"
                v-model="query"
                role="combobox"
                :aria-label="t('Search accounts')"
                :aria-controls="LISTBOX_ID"
                :aria-activedescendant="activeId"
                :aria-expanded="true"
                :placeholder="t('Search accounts')">
                <template #leading><FpIcon name="icon-[lucide--search]" /></template>
            </FpInput>
        </div>
        <FillBanner
            v-if="banner"
            :icon="banner.icon"
            :title="banner.title"
            :address="banner.address"
            :label="fillLabel"
            :filled
            :disabled="!canFill"
            @fill="fill" />
        <PickerList
            class="min-h-0 flex-1"
            :rows
            :revealed
            :has-accounts="hasAccounts">
            <template #row="{ account, index: at }">
                <PopupRow
                    :account
                    :selected="at === index"
                    :concealed="isConcealed(account)"
                    :copied-login="isCopied('login', account.id)"
                    :copied-password="isCopied('password', account.id)"
                    @hover="select(at)"
                    @choose="select(at)"
                    @copy-login="copyLogin(account)"
                    @copy-password="copyPassword(account)"
                    @open-app="openInApp(account)"
                    @unlock="unlock(account)" />
            </template>
        </PickerList>
        <AccountPrompt
            v-if="asking"
            v-model="password"
            :name="asking.nickname"
            :message="passwordError"
            @submit="submitPassword"
            @cancel="cancelPassword" />
        <PopupFooter :count="countLabel" :can-fill="hasBanner" />
    </div>
</template>
