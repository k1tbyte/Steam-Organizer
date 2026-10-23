<script setup lang="ts">
import { FpAsyncView, FpButton, FpIcon, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import PageTopbar from '#components/PageTopbar.vue'
import { SyncStatus } from '#features/backups'
import { NotificationsBell } from '#features/notifications'

import { useAccountsFilters } from '../../composables/useAccountsFilters'
import { useAccountsList } from '../../composables/useAccountsList'
import { useAddAccountOverlay } from '../../composables/useAddAccountOverlay'
import AddAccountOverlay from '../add/AddAccountOverlay.vue'
import AccountsReorderGrid from '../reorder/AccountsReorderGrid.vue'
import AccountsEmpty from './AccountsEmpty.vue'
import AccountsGrid from './AccountsGrid.vue'
import AccountsSearch from './AccountsSearch.vue'
import RefreshActivity from './RefreshActivity.vue'

const { t } = useI18n()
const desktop = useDesktopLayout()
const list = useAccountsList()
const { resetFilters } = useAccountsFilters()
const addOverlay = useAddAccountOverlay()
</script>

<template>
    <PageTopbar :title="t('Accounts')" :count="list.count.value">
        <template #status><SyncStatus /></template>
        <template #center><AccountsSearch /></template>
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
            <FpButton v-else square round size="xl" color="accent" :aria-label="t('Add account')" @click="addOverlay.show()">
                <FpIcon name="icon-[lucide--plus]" />
            </FpButton>
        </template>
    </PageTopbar>

    <FpAsyncView :status="list.status.value">
        <AccountsReorderGrid v-if="list.reordering.value" :pinned="list.pinned.value" :rest="list.rest.value" />
        <AccountsGrid v-else :pinned="list.pinned.value" :rest="list.rest.value" @toggle-pin="list.togglePin" />
        <template #empty>
            <AccountsEmpty :vault-empty="list.vaultEmpty.value" @add="addOverlay.show()" @reset="resetFilters" />
        </template>
    </FpAsyncView>
    <AddAccountOverlay />
</template>
