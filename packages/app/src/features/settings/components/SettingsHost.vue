<script setup lang="ts">
import { useDesktopLayout } from '@so/ui'

import { useSettingsLayoutSync } from '../composables/useSettingsLayoutSync'
import SettingsModal from './SettingsModal.vue'

const desktop = useDesktopLayout()
useSettingsLayoutSync()
</script>

<!-- Phones have no window: settings is a routed screen there. -->
<template>
    <SettingsModal v-if="desktop" />
</template>
