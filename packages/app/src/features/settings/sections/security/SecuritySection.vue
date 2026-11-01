<script setup lang="ts">
import { useDesktopLayout } from '@so/ui'
import { ref } from 'vue'

import ChangePasswordDialog from '../../dialogs/password/ChangePasswordDialog.vue'
import SetPinDialog from '../../dialogs/pin/SetPinDialog.vue'
import SecurityDesktop from './SecurityDesktop.vue'
import SecurityMobile from './SecurityMobile.vue'

const desktop = useDesktopLayout()
const passwordOpen = ref(false)
const pinOpen = ref(false)
</script>

<template>
    <SecurityDesktop
        v-if="desktop"
        @change-password="passwordOpen = true"
        @set-pin="pinOpen = true" />
    <SecurityMobile v-else @change-password="passwordOpen = true" @set-pin="pinOpen = true" />
    <ChangePasswordDialog v-model:open="passwordOpen" />
    <SetPinDialog v-model:open="pinOpen" />
</template>
