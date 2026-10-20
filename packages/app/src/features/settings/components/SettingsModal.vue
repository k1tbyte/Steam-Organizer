<script setup lang="ts">
import { FpModal, FpModalClose } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSettingsOverlay } from '../composables/useSettingsOverlay'
import { useSettingsSections } from '../composables/useSettingsSections'
import SettingsModalNav from './SettingsModalNav.vue'
import SettingsSectionBody from './SettingsSectionBody.vue'

const { t } = useI18n()
const overlay = useSettingsOverlay()
const { groups, find } = useSettingsSections()

const current = computed(() => find(overlay.value.value))
</script>

<template>
    <FpModal
        v-model:open="overlay.open.value"
        bare
        :title="t('Settings')"
        :description="current?.description"
        width="min(92vw, 60rem)">
        <div class="grid h-165 max-h-[calc(100dvh-3rem)] grid-cols-[14.5rem_minmax(0,1fr)]">
            <SettingsModalNav
                :groups="groups"
                :current="overlay.value.value"
                @select="overlay.show" />
            <div class="flex min-h-0 min-w-0 flex-col">
                <div class="flex shrink-0 items-start gap-3 pt-5.5 pr-5.5 pb-3.5 pl-8">
                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                        <span class="font-title text-20 text-fg-1">{{ current?.title }}</span>
                        <span class="text-13 text-fg-3">{{ current?.description }}</span>
                    </div>
                    <FpModalClose :label="t('Close (Esc)')" />
                </div>
                <div class="min-h-0 flex-1 overflow-y-auto px-8 pb-7">
                    <SettingsSectionBody :section="overlay.value.value" />
                </div>
            </div>
        </div>
    </FpModal>
</template>
