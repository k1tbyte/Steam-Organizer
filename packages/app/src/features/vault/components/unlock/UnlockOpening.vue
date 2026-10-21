<script setup lang="ts">
import { FpAlert, FpIcon, FpIconTile, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ vaultName: string }>()
const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<template>
    <FpAlert v-if="desktop" color="success" class="font-semibold">
        {{ t('Unlocked · opening {vault}', { vault: vaultName }) }}
    </FpAlert>
    <div v-else class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 pb-15">
        <FpIconTile size="2xl" round color="success">
            <FpIcon name="icon-[lucide--check]" class="text-28" />
        </FpIconTile>
        <span class="font-title text-20 text-fg-1">{{ t('Unlocked') }}</span>
        <span class="text-14 text-fg-3">{{ t('Opening {vault}', { vault: vaultName }) }}</span>
    </div>
</template>
