<script setup lang="ts">
import { useDesktopLayout } from '@so/ui'
import { ref } from 'vue'

import ChangePasswordDialog from '../../dialogs/password/ChangePasswordDialog.vue'
import SecurityDesktop from './SecurityDesktop.vue'
import SecurityMobile from './SecurityMobile.vue'

const desktop = useDesktopLayout()
const passwordOpen = ref(false)
</script>

<template>
    <SecurityDesktop v-if="desktop" @change-password="passwordOpen = true" />
    <SecurityMobile v-else @change-password="passwordOpen = true" />
    <ChangePasswordDialog v-model:open="passwordOpen" />
</template>
