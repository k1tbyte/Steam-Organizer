<script setup lang="ts">
import { useDesktopLayout, useOpenedOnce } from '@so/ui'
import { defineAsyncComponent } from 'vue'

import { useSettingsLayoutSync } from '../composables/useSettingsLayoutSync'
import { useSettingsOverlay } from '../composables/useSettingsOverlay'

// Loads on the first open and stays for its close animation.
const SettingsModal = defineAsyncComponent(() => import('./SettingsModal.vue'))

const desktop = useDesktopLayout()
const opened = useOpenedOnce(useSettingsOverlay().open)
useSettingsLayoutSync()
</script>

<!-- Phones have no window: settings is a routed screen there. -->
<template>
    <SettingsModal v-if="desktop && opened" />
</template>
