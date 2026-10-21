<script setup lang="ts">
import { FpNavMenu, FpScrollArea } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAboutApp } from '../composables/useAboutApp'
import type { SectionKey, SettingsGroup } from '../model'

const props = defineProps<{ groups: SettingsGroup[]; current: SectionKey }>()
defineEmits<{ select: [section: SectionKey] }>()

const { t } = useI18n()
const about = useAboutApp()

const items = computed(() =>
    props.groups.flatMap((group) =>
        group.sections.map((section) => ({
            value: section.key,
            label: section.title,
            icon: section.icon,
            disabled: section.soon,
            badge: section.soon ? t('Soon') : undefined,
            group: group.title,
        })),
    ),
)
</script>

<template>
    <nav class="flex min-h-0 flex-col border-r border-stroke-1 bg-surface-lo px-2.5 pt-4.5 pb-3">
        <div class="flex items-center gap-2.5 px-2 pb-2">
            <img :src="logoUrl" alt="" class="size-5.5" />
            <span class="font-semibold text-15 tracking-title text-fg-1">{{ t('Settings') }}</span>
        </div>
        <FpScrollArea class="min-h-0 flex-1">
            <FpNavMenu
                :items="items"
                :model-value="current"
                :aria-label="t('Settings')"
                @update:model-value="$emit('select', $event as SectionKey)" />
        </FpScrollArea>
        <div v-if="about" class="flex items-center gap-2 px-2.5 py-2 font-mono text-12 text-fg-3">
            {{ t('v{version}', { version: about.version }) }}
            <span class="flex-1" />
            <button
                v-if="about.update"
                type="button"
                class="cursor-pointer font-medium font-sans text-12 text-accent-ink hover:text-fg-1">
                {{ t('Update to {version}', { version: about.update }) }}
            </button>
        </div>
    </nav>
</template>
