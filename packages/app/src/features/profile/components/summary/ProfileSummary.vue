<script setup lang="ts">
import type { Account } from '#features/accounts'

import type { AccountGateState } from '../../composables/lock/useAccountGate'
import type { BansState } from '../../composables/useBans'
import type { ProfileData } from '../../model'
import CredentialsSection from '../credentials/CredentialsSection.vue'
import BansSection from './BansSection.vue'
import CommunitySection from './CommunitySection.vue'
import NoteSection from './NoteSection.vue'

defineProps<{
    account: Account
    details: ProfileData
    gate: AccountGateState
    bans: BansState
    touch: boolean
}>()
const emit = defineEmits<{ lock: [] }>()
</script>

<template>
    <!-- Phones stack the sections in one list (the note last); desktop splits them into two columns. -->
    <div class="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start lg:gap-u-4">
        <div class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-u-4">
            <CredentialsSection
                :account-id="account.id"
                :credentials="details.credentials"
                :gate="gate"
                :touch="touch"
                @lock="emit('lock')" />
            <!-- A locked account seals its note with the credentials. -->
            <NoteSection v-if="!gate.locked" class="max-lg:order-last" :account="account" />
        </div>
        <div v-if="!account.anonymous" class="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-u-4">
            <CommunitySection :details="details" />
            <BansSection :class="bans.banned && 'lg:order-first'" :bans="bans" />
        </div>
    </div>
</template>
