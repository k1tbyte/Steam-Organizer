<script setup lang="ts">
import { FpAsyncView, FpButton, FpIcon, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import PageTopbar from '#components/PageTopbar.vue'
import { NotificationsBell } from '#features/notifications'
import { SyncStatus } from '#features/shell'

import { useAccountsFilters } from '../../composables/useAccountsFilters'
import { useAccountsList } from '../../composables/useAccountsList'
import { useAddAccountOverlay } from '../../composables/useAddAccountOverlay'
import AddAccountOverlay from '../add/AddAccountOverlay.vue'
import AccountsEmpty from './AccountsEmpty.vue'
import AccountsFilterBar from './AccountsFilterBar.vue'
import AccountsGrid from './AccountsGrid.vue'
import AccountsSearch from './AccountsSearch.vue'
import BanFilterChips from './BanFilterChips.vue'
import CardFieldsPanel from './CardFieldsPanel.vue'
import RefreshActivity from './RefreshActivity.vue'
import SortMenu from './SortMenu.vue'

const { t } = useI18n()
const desktop = useDesktopLayout()
const list = useAccountsList()
const { resetFilters } = useAccountsFilters()
const addOverlay = useAddAccountOverlay()
</script>

<template>
    <PageTopbar :title="t('Accounts')" :count="list.count.value">
        <template #status><SyncStatus /></template>
        <template #center>
            <AccountsSearch />
            <div v-if="!desktop" class="-mx-4 mt-2.5 flex items-center gap-1.5 overflow-x-auto px-4">
                <SortMenu />
                <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
                <BanFilterChips />
                <span class="mx-0.5 h-5 w-px shrink-0 bg-stroke-1" />
                <CardFieldsPanel />
            </div>
        </template>
        <template #actions>
            <RefreshActivity
                v-if="list.refresh.value"
                :remaining="list.refresh.value.remaining"
                :progress="list.refresh.value.progress" />
            <NotificationsBell />
            <FpButton v-if="desktop" color="accent" @click="addOverlay.show()">
                <FpIcon name="icon-[lucide--plus]" />
                {{ t('Add') }}
            </FpButton>
            <FpButton v-else square round size="xl" color="accent" :title="t('Add account')" @click="addOverlay.show()">
                <FpIcon name="icon-[lucide--plus]" />
            </FpButton>
        </template>
    </PageTopbar>

    <AccountsFilterBar v-if="desktop" />
    <FpAsyncView :status="list.status.value">
        <AccountsGrid :pinned="list.pinned.value" :rest="list.rest.value" @toggle-pin="list.togglePin" />
        <template #empty>
            <AccountsEmpty :vault-empty="list.vaultEmpty.value" @add="addOverlay.show()" @reset="resetFilters" />
        </template>
    </FpAsyncView>
    <AddAccountOverlay />
</template>
