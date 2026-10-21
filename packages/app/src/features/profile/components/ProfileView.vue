<script setup lang="ts">
import { FpButton, FpCard, FpEmpty, FpIcon, FpTabs, useDesktopLayout } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import { useAccountGate } from '../composables/useAccountGate'
import { useBans } from '../composables/useBans'
import { useLockDialog } from '../composables/useLockDialog'
import { useProfileHeader } from '../composables/useProfileHeader'
import { useProfileTabs } from '../composables/useProfileTabs'
import { useSteamIdField } from '../composables/useSteamIdField'
import type { ProfileData } from '../model'
import SteamGuardTab from './guard/SteamGuardTab.vue'
import ProfileHero from './hero/ProfileHero.vue'
import ProfileHeroPhone from './hero/ProfileHeroPhone.vue'
import AccountLockGate from './lock/AccountLockGate.vue'
import LockAccountDialog from './lock/LockAccountDialog.vue'
import ProfileTopbar from './ProfileTopbar.vue'
import ProfileSummary from './summary/ProfileSummary.vue'

const props = defineProps<{ account: Account; details: ProfileData }>()
const emit = defineEmits<{ togglePin: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const gate = reactive(useAccountGate(() => props.details.lock))
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
        () => ({ friendCode: props.details.friendCode, vanity: props.details.vanity }),
    ),
)
const tabs = reactive(
    useProfileTabs(
        () => props.account,
        () => props.details,
        { icons: desktop, guardHidden: () => gate.locked },
    ),
)
const lockDialog = reactive(useLockDialog())
</script>

<template>
    <ProfileTopbar
        :nickname="account.nickname"
        :has-lock="details.lock !== null"
        :refreshable="!gate.hidesProfile"
        :editable="!gate.locked"
        @lock="lockDialog.show" />

    <div class="flex flex-col gap-3 px-4 pb-5 lg:gap-u-4 lg:px-u-6 lg:pt-u-5 lg:pb-u-6">
        <ProfileHero
            v-if="desktop"
            :account="account"
            :header="header"
            :bans="bans"
            :id-field="idField"
            :gate="gate"
            @toggle-pin="emit('togglePin')" />
        <ProfileHeroPhone
            v-else
            :account="account"
            :header="header"
            :bans="bans"
            :id-field="idField"
            :gate="gate" />

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
                <FpEmpty :title="t('Games')" :description="t('The game list comes with Steam data.')">
                    <template #leading><FpIcon name="icon-[lucide--gamepad-2]" /></template>
                </FpEmpty>
            </template>
            <template #friends>
                <FpEmpty :title="t('Friends')" :description="t('The friend list comes with Steam data.')">
                    <template #leading><FpIcon name="icon-[lucide--users]" /></template>
                </FpEmpty>
            </template>
            <template #guard>
                <SteamGuardTab :seed="account.id" :revocation-code="details.revocationCode" />
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
</template>
