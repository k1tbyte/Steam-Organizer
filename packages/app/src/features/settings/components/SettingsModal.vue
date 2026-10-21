<script setup lang="ts">
import { FpModal, FpModalClose, FpScrollArea, FpViewStack } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSettingsOverlay } from '../composables/useSettingsOverlay'
import { useSettingsSections } from '../composables/useSettingsSections'
import SettingsModalNav from './SettingsModalNav.vue'
import SettingsSectionBody from './SettingsSectionBody.vue'

const { t } = useI18n()
const overlay = useSettingsOverlay()
const { groups, find, position } = useSettingsSections()

const current = computed(() => find(overlay.value.value))
const depth = computed(() => position(overlay.value.value))
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
            <!-- The close button stays put while the section under it slides along the nav. -->
            <div class="relative flex min-h-0 min-w-0 flex-col">
                <FpModalClose :label="t('Close (Esc)')" class="absolute top-5.5 right-5.5 z-1" />
                <FpViewStack :view="overlay.value.value" :depth="depth" axis="y" :morph="false">
                    <div class="flex shrink-0 flex-col gap-1 pt-5.5 pr-16 pb-3.5 pl-8">
                        <span class="font-title text-20 text-fg-1">{{ current?.title }}</span>
                        <span class="text-13 text-fg-3">{{ current?.description }}</span>
                    </div>
                    <FpScrollArea class="min-h-0 flex-1">
                        <div class="px-8 pb-7">
                            <SettingsSectionBody :section="overlay.value.value" />
                        </div>
                    </FpScrollArea>
                </FpViewStack>
            </div>
        </div>
    </FpModal>
</template>
