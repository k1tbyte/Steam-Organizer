<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
            <RouterLink
                to="/settings"
                class="ml-1 flex h-11 w-fit items-center gap-0.5 pr-2.5 pl-1 text-14.5 text-accent-ink">
                <FpIcon name="icon-[lucide--chevron-left]" class="text-22" />
                {{ t('Settings') }}
            </RouterLink>
        </template>
    </PageTopbar>
    <div class="px-4 pb-5">
        <SettingsSectionBody :section="section" />
    </div>
</template>
