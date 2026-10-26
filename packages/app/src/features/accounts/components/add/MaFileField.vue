<script setup lang="ts">
import { FpButton, FpDropZone, FpIcon, openFilePicker, tip, useDesktopLayout } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { MaFilePick } from '#features/steam-guard'

const ACCEPT = '.mafile,.json'

const props = defineProps<{ pick: MaFilePick | null; login: string }>()
const emit = defineEmits<{ attach: [files: File[]]; remove: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const shown = computed(() => {
    const pick = props.pick
    if (!pick) return null
    if (pick.problem === 'broken')
        return { icon: 'icon-[lucide--file-x-2]', note: t('Not a valid maFile: shared_secret is missing'), danger: true }
    if (pick.problem === 'another')
        return {
            icon: 'icon-[lucide--user-x]',
            note: t('For {file}, not {login}', { file: pick.inFile, login: props.login.trim() }),
            danger: true,
        }
    return { icon: 'icon-[lucide--shield-check]', note: t('shared_secret found · codes will appear on the card'), danger: false }
})
const replace = () => openFilePicker({ accept: ACCEPT, onPick: (files) => emit('attach', files) })
</script>

<template>
    <div v-if="pick && shown" class="flex min-h-11.5 items-center gap-2.5 rounded bg-surface-hi py-1.5 pr-1 pl-3">
        <FpIcon :name="shown.icon" class="shrink-0 text-16" :class="shown.danger ? 'text-danger' : 'text-success'" />
        <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate font-medium font-mono text-12.5 text-fg-1">{{ pick.name }}</span>
            <span class="text-12" :class="shown.danger ? 'text-danger' : 'text-fg-3'">{{ shown.note }}</span>
        </span>
        <FpButton v-if="shown.danger" size="xs" variant="soft" :label="t('Replace')" @click="replace" />
        <FpButton v-bind="tip(t('Remove'), { label: true })" square size="md" variant="ghost" class="text-fg-3!" @click="emit('remove')">
            <FpIcon name="icon-[lucide--x]" />
        </FpButton>
    </div>
    <FpDropZone
        v-else
        compact
        :accept="ACCEPT"
        class="min-h-13 justify-start! px-3! py-0! text-left lg:min-h-11.5"
        :title="t('Import authenticator from a .maFile')"
        @files="emit('attach', $event)">
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
