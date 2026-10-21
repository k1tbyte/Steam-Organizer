<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import PageTopbar from '#components/PageTopbar.vue'

import { useSettingsSections } from '../composables/useSettingsSections'
import type { SectionKey } from '../model'
import SettingsSectionBody from './SettingsSectionBody.vue'

const props = defineProps<{ section: SectionKey }>()
const { t } = useI18n()
const { find } = useSettingsSections()

const title = computed(() => find(props.section)?.title ?? '')
</script>

<template>
    <PageTopbar :title="title">
        <template #back>
            <FpButton
                :as="RouterLink"
                to="/settings"
                square
                round
                variant="soft"
                :aria-label="t('Back to Settings')">
                <FpIcon name="icon-[lucide--chevron-left]" />
            </FpButton>
        </template>
    </PageTopbar>
    <div class="px-4 pb-5">
        <SettingsSectionBody :section="section" />
    </div>
</template>
