<script setup lang="ts">
import { TooltipProvider } from 'reka-ui'

import MockPanel from '#components/MockPanel.vue'

import { usePopupFrame } from '../composables/usePopupFrame'
import PopupHeader from './popup/PopupHeader.vue'
import PopupLocked from './popup/PopupLocked.vue'
import PopupMain from './popup/PopupMain.vue'
import PopupSetup from './popup/PopupSetup.vue'

const { view, unlocked, lock, openApp } = usePopupFrame()
</script>

<!-- 380x580 like the toolbar popup; a touch device (Firefox Android) opens it full screen. -->
<template>
    <div class="bg-stage" aria-hidden="true" />
    <TooltipProvider :delay-duration="300">
        <div class="panel-base relative mx-auto flex h-145 w-95 flex-col overflow-hidden pointer-coarse:h-dvh pointer-coarse:w-full">
            <PopupHeader :unlocked @open-app="openApp()" @lock="lock" />
            <PopupMain v-if="view === 'accounts'" />
            <PopupLocked v-else-if="view === 'locked'" @forgot="openApp('/unlock')" />
            <PopupSetup v-else @open-app="openApp()" />
        </div>
    </TooltipProvider>
    <MockPanel />
</template>
