<script setup lang="ts">
import { FpIcon, FpSkeleton } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { AddAccountFormState } from '../../composables/add/useAddAccountForm'
import LevelAvatar from '../card/LevelAvatar.vue'

defineProps<{
    loading: boolean
    profile: AddAccountFormState['profile']
}>()

const { t } = useI18n()
</script>

<template>
    <div v-if="loading" class="flex h-14 items-center gap-3 rounded bg-surface-hi px-3">
        <FpSkeleton class="size-9 shrink-0 rounded bg-stroke-1!" />
        <span class="flex flex-col gap-1.5">
            <FpSkeleton class="h-2.5 w-30 rounded bg-stroke-2!" />
            <FpSkeleton class="h-2 w-20 rounded bg-stroke-1!" />
        </span>
        <span class="flex-1" />
        <span class="text-12.5 text-fg-3">{{ t('Looking up on Steam…') }}</span>
    </div>
    <div v-else-if="profile" class="flex h-14 items-center gap-3 rounded bg-surface-hi px-3">
        <LevelAvatar size="sm" ring :name="profile.nickname" :hue="profile.hue" :level="profile.level" />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="truncate font-semibold text-13.5 text-fg-1">{{ profile.nickname }}</span>
            <span class="truncate font-mono text-12 text-fg-3">{{ profile.summary }}</span>
        </span>
        <span
            class="inline-flex shrink-0 items-center gap-1.25 text-12"
            :class="profile.clean ? 'text-success' : 'text-danger'">
            <FpIcon :name="profile.clean ? 'icon-[lucide--shield-check]' : 'icon-[lucide--shield-alert]'" />
            {{ profile.bans }}
        </span>
    </div>
</template>
