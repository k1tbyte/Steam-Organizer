<script setup lang="ts">
import { FpAsyncView } from '@so/ui'

import { useProfile } from '../composables/useProfile'
import ProfileView from './ProfileView.vue'

const profile = useProfile()
</script>

<template>
    <FpAsyncView :status="profile.status.value">
        <ProfileView
            v-if="profile.account.value && profile.details.value"
            :account="profile.account.value"
            :details="profile.details.value"
            @toggle-pin="profile.togglePin" />
    </FpAsyncView>
</template>
