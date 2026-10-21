<script setup lang="ts">
import { FpButton, FpCard, FpDot, FpEyebrow, FpIcon, FpIconTile } from '@so/ui'
import { useI18n } from 'vue-i18n'

import PageTopbar from '#components/PageTopbar.vue'

import { useAboutApp } from '../composables/useAboutApp'
import { useSettingsSections } from '../composables/useSettingsSections'
import { useSettingsSummary } from '../composables/useSettingsSummary'
import SettingsMobileRow from './SettingsMobileRow.vue'

const { t } = useI18n()
const { groups } = useSettingsSections()
const { summaryOf, vaultName, syncLine, syncColor } = useSettingsSummary()
const about = useAboutApp()
</script>

<template>
    <PageTopbar :title="t('Settings')" />
    <div class="flex flex-col gap-5 px-4 pb-5">
        <FpCard flush>
            <div class="flex items-center gap-3 py-3 pr-3 pl-3.5">
                <FpIconTile name="icon-[lucide--vault]" color="accent" />
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span class="font-semibold text-14.5 text-fg-1">{{ vaultName }}</span>
                    <span class="flex items-center gap-1.5 text-12 text-fg-3">
                        <FpDot :color="syncColor" />
                        {{ syncLine }}
                    </span>
                </div>
                <FpButton
                    square
                    round
                    size="xl"
                    variant="soft"
                    :aria-label="t('Lock vault')">
                    <FpIcon name="icon-[lucide--lock]" />
                </FpButton>
            </div>
        </FpCard>
        <section v-for="group in groups" :key="group.key" class="flex flex-col gap-2">
            <FpEyebrow class="px-1">{{ group.title }}</FpEyebrow>
            <FpCard flush class="pl-3.5">
                <SettingsMobileRow
                    v-for="section in group.sections"
                    :key="section.key"
                    :title="section.title"
                    :icon="section.icon"
                    :value="summaryOf(section.key)"
                    :to="section.soon ? undefined : `/settings/${section.key}`" />
            </FpCard>
        </section>
        <p v-if="about" class="text-center font-mono text-12.5 text-fg-3">
            {{ t('Steam Organizer {version}', { version: about.version }) }}
        </p>
    </div>
</template>
