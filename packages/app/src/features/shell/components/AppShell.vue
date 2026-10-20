<script setup lang="ts">
import { FpScrollArea, useDesktopLayout } from '@so/ui'
import { useTemplateRef } from 'vue'

import { useTopbarOutlets } from '#core'
import { SettingsHost } from '#features/settings'

import { useShellNav } from '../composables/useShellNav'
import { useShellScroll } from '../composables/useShellScroll'
import ShellRail from './ShellRail.vue'
import ShellTabBar from './ShellTabBar.vue'

const desktop = useDesktopLayout()
const { showTabBar } = useShellNav()
const { bind } = useTopbarOutlets()

// Overlay bars on desktop; phones keep the native scroller.
const desktopScroll = useTemplateRef('desktopScroll')
const phoneScroll = useTemplateRef('phoneScroll')
useShellScroll(() => desktopScroll.value?.viewport ?? phoneScroll.value)
</script>

<template>
    <div v-if="desktop" class="flex h-dvh">
        <ShellRail />
        <div class="flex min-w-0 flex-1 flex-col">
            <header
                class="grid h-15 shrink-0 grid-cols-[1fr_minmax(0,35rem)_1fr] items-center gap-4 border-b border-stroke-1 px-u-6">
                <div :ref="bind.title" class="flex items-baseline gap-2" />
                <div :ref="bind.center" />
                <div class="flex items-center justify-end gap-2.5">
                    <div :ref="bind.status" class="flex" />
                    <div :ref="bind.actions" class="flex items-center gap-2.5" />
                </div>
            </header>
            <FpScrollArea ref="desktopScroll" as="main" class="min-h-0 flex-1">
                <RouterView />
            </FpScrollArea>
        </div>
    </div>
    <div v-else class="safe-pt flex h-dvh flex-col">
        <div :ref="bind.back" class="shrink-0 empty:hidden" />
        <header class="flex shrink-0 items-center gap-1 pt-1.5 pr-3 pb-3 pl-4">
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <div :ref="bind.title" class="flex items-baseline gap-2" />
                <div :ref="bind.status" class="empty:hidden" />
            </div>
            <div :ref="bind.actions" class="flex items-center gap-1" />
        </header>
        <div :ref="bind.center" class="shrink-0 px-4 pb-2.5 empty:hidden" />
        <main ref="phoneScroll" class="min-h-0 flex-1 overflow-y-auto">
            <RouterView />
        </main>
        <ShellTabBar v-if="showTabBar" />
    </div>
    <SettingsHost />
</template>
