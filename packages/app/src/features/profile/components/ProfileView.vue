<script setup lang="ts">
import { FpButton, FpCard, FpIcon, FpTabs, useDesktopLayout } from '@so/ui'
import { reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { type Account, AccountTagPicker, RemoveAccountsDialog, useRemoveAccounts } from '#features/accounts'
import { useAuthenticator } from '../composables/guard/useAuthenticator'
import { useAliasEditor } from '../composables/hero/useAliasEditor'
import { useProfileHeader } from '../composables/hero/useProfileHeader'
import { useSteamIdField } from '../composables/hero/useSteamIdField'
import { useAccountGate } from '../composables/lock/useAccountGate'
import { useAccountPasswordDialog } from '../composables/lock/useAccountPasswordDialog'
import { useLockDialog } from '../composables/lock/useLockDialog'
import { useBans } from '../composables/useBans'
import type { ProfileIntent } from '../composables/useProfileMenu'
import { useProfileRefresh } from '../composables/useProfileRefresh'
import { useProfileTabs } from '../composables/useProfileTabs'
import type { ProfileData } from '../model'
import RemoveAuthenticatorDialog from './guard/RemoveAuthenticatorDialog.vue'
import SteamGuardTab from './guard/SteamGuardTab.vue'
import ProfileHero from './hero/ProfileHero.vue'
import ProfileHeroPhone from './hero/ProfileHeroPhone.vue'
import FriendsTab from './library/FriendsTab.vue'
import GamesTab from './library/GamesTab.vue'
import AccountLockGate from './lock/AccountLockGate.vue'
import AccountPasswordDialog from './lock/AccountPasswordDialog.vue'
import LockAccountDialog from './lock/LockAccountDialog.vue'
import ProfileTopbar from './ProfileTopbar.vue'
import ProfileSummary from './summary/ProfileSummary.vue'

const props = defineProps<{ account: Account; details: ProfileData }>()
const emit = defineEmits<{ togglePin: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const gate = reactive(
    useAccountGate(
        () => props.account,
        () => props.details.lock,
    ),
)
const header = reactive(
    useProfileHeader(
        () => props.account,
        () => props.details,
    ),
)
const bans = reactive(
    useBans(
        () => props.account,
        () => props.details,
    ),
)
const idField = reactive(
    useSteamIdField(
        () => props.account.steamId ?? '',
        () => props.details.vanity,
    ),
)
const tabs = reactive(
    useProfileTabs(
        () => props.account,
        () => props.details,
        { icons: desktop, guardHidden: () => gate.locked },
    ),
)
const steam = reactive(
    useProfileRefresh(
        () => props.account,
        () => gate.hidesProfile,
    ),
)
const lockDialog = reactive(useLockDialog(() => props.account.id))
const passwordDialog = reactive(useAccountPasswordDialog(() => props.account))
const authenticator = reactive(useAuthenticator(() => props.account))
const removal = reactive(useRemoveAccounts())
function onIntent(kind: ProfileIntent) {
    if (kind === 'delete') removal.ask([props.account.id])
    else passwordDialog.show()
}
const tagsOpen = shallowRef(false)
const tagsAnchor = shallowRef<HTMLElement>()
function editTags(anchor: HTMLElement) {
    tagsAnchor.value = anchor
    tagsOpen.value = true
}
const alias = reactive(
    useAliasEditor(
        () => props.account,
        () => !gate.locked,
    ),
)
</script>

<template>
    <ProfileTopbar
        :nickname="account.nickname"
        :has-lock="details.lock !== null"
        :refreshable="steam.refreshable"
        :refreshing="steam.refreshing"
        @refresh="steam.refresh"
        @lock="lockDialog.show"
        @intent="onIntent" />

    <div class="flex flex-col gap-3 px-4 pb-5 lg:gap-u-4 lg:px-u-6 lg:pt-u-5 lg:pb-u-6">
        <ProfileHero
            v-if="desktop"
            :account="account"
            :header="header"
            :bans="bans"
            :id-field="idField"
            :gate="gate"
            :alias="alias"
            :guard-failed="authenticator.failed"
            @toggle-pin="emit('togglePin')"
            @edit-tags="editTags"
            @import-ma-file="authenticator.pick" />
        <ProfileHeroPhone
            v-else
            :account="account"
            :header="header"
            :bans="bans"
            :id-field="idField"
            :gate="gate"
            :alias="alias"
            :guard-failed="authenticator.failed"
            @edit-tags="editTags"
            @import-ma-file="authenticator.pick" />

        <FpCard v-if="gate.hidesProfile">
            <AccountLockGate standalone :gate="gate" :touch="!desktop" />
        </FpCard>
        <FpTabs
            v-else
            v-model="tabs.active"
            :items="tabs.items"
            :variant="desktop ? 'underline' : 'pills'"
            :class="desktop ? 'gap-u-4' : 'mt-1'">
            <template #summary>
                <ProfileSummary
                    :account="account"
                    :details="details"
                    :gate="gate"
                    :bans="bans"
                    :touch="!desktop"
                    @lock="lockDialog.show" />
            </template>
            <template #games>
                <GamesTab :account="account" :details="details" />
            </template>
            <template #friends>
                <FriendsTab :account="account" :details="details" />
            </template>
            <template #guard>
                <SteamGuardTab
                    :seed="account.id"
                    :revocation-code="details.revocationCode"
                    @remove-authenticator="authenticator.removeOpen = true" />
            </template>
        </FpTabs>

        <FpButton
            v-if="!desktop && gate.canRelock"
            variant="outline"
            size="xl"
            block
            @click="gate.relock">
            <FpIcon name="icon-[lucide--lock-keyhole]" />
            {{ t('Lock now') }}
        </FpButton>
    </div>

    <LockAccountDialog :account="account" :dialog="lockDialog" />
    <AccountPasswordDialog :account="account" :dialog="passwordDialog" />
    <RemoveAccountsDialog :removal="removal" />
    <RemoveAuthenticatorDialog :authenticator="authenticator" :revocation-code="details.revocationCode" />
    <AccountTagPicker v-model:open="tagsOpen" :anchor="tagsAnchor" :account="account" />
</template>
