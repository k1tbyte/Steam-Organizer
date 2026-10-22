<script setup lang="ts">
import { FpButton, FpDropZone, FpIcon, tip, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ fileName: string | null }>()
defineEmits<{ attach: [files: File[]]; remove: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<template>
    <div v-if="fileName" class="flex min-h-11.5 items-center gap-2.5 rounded bg-surface-hi py-1.5 pr-1 pl-3 lg:min-h-11.5">
        <FpIcon name="icon-[lucide--shield-check]" class="shrink-0 text-16 text-success" />
        <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate font-medium font-mono text-12.5 text-fg-1">{{ fileName }}</span>
            <span class="text-12 text-fg-3">{{ t('shared_secret found · codes will appear on the card') }}</span>
        </span>
        <FpButton v-bind="tip(t('Remove'), { label: true })" square size="md" variant="ghost" class="text-fg-3!" @click="$emit('remove')">
            <FpIcon name="icon-[lucide--x]" />
        </FpButton>
    </div>
    <FpDropZone
        v-else
        compact
        accept=".mafile,.json"
        class="min-h-13 justify-start! px-3! py-0! text-left lg:min-h-11.5"
        :title="t('Import authenticator from a .maFile')"
        @files="$emit('attach', $event)">
        <template #default="{ dragging }">
            <FpIcon name="icon-[lucide--file-key-2]" class="shrink-0 text-16 text-fg-3" />
            <span class="min-w-0 flex-1 text-13">
                {{ dragging ? t('Drop to attach') : t('Import authenticator from a .maFile') }}
            </span>
            <span class="shrink-0 text-12 text-fg-3">
                {{ desktop ? t('Drop or browse') : t('Browse') }}
            </span>
        </template>
    </FpDropZone>
</template>
