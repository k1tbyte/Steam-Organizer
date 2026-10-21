<script setup lang="ts">
import { FpScrollArea, useDesktopLayout } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<!-- The bare page frame: desktop has a brand header and a centered column, phones bring their own bars. -->
<template>
    <div v-if="desktop" class="flex h-dvh flex-col">
        <header class="flex h-16 shrink-0 items-center gap-2.5 px-7">
            <img :src="logoUrl" alt="" class="size-6.5" />
            <span class="font-semibold text-14.5 text-fg-1 tracking-title">
                {{ t('Steam Organizer') }}
            </span>
            <span class="flex-1" />
            <slot name="aside" />
        </header>
        <FpScrollArea as="main" class="min-h-0 flex-1">
            <div
                class="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 pb-16">
                <slot />
            </div>
        </FpScrollArea>
    </div>
    <div v-else class="safe-pt flex h-dvh flex-col">
        <slot />
    </div>
</template>
