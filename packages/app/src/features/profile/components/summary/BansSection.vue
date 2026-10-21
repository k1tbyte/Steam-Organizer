<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { BansState } from '../../composables/useBans'
import CollapsibleSection from './CollapsibleSection.vue'

defineProps<{ bans: BansState }>()

const { t } = useI18n()
</script>

<template>
    <CollapsibleSection section="bans" :title="t('Bans')" icon="icon-[lucide--shield]">
        <template #meta>
            <span class="font-normal text-12.5 max-lg:hidden" :class="bans.banned ? 'text-danger' : 'text-success'">
                {{ bans.summary }}
            </span>
        </template>
        <ul class="flex flex-col px-2 pb-2">
            <li v-for="row in bans.rows" :key="row.kind" class="flex h-9.5 items-center gap-2.5 px-2 max-lg:h-11">
                <FpIcon
                    :name="row.active ? 'icon-[lucide--circle-alert]' : 'icon-[lucide--circle-check]'"
                    class="text-16"
                    :class="row.active ? 'text-danger' : 'text-success'" />
                <span class="flex-1 text-13.5 text-fg-1">{{ row.label }}</span>
                <span class="text-12.5 tabular-nums" :class="row.active ? 'text-danger' : 'text-fg-3'">
                    {{ row.value }}
                </span>
            </li>
            <li
                v-if="bans.lastBan"
                class="mt-1 flex items-center gap-1.5 border-stroke-1 border-t border-dashed px-2 pt-2.5 pb-1 text-12 text-fg-3">
                <FpIcon name="icon-[lucide--history]" class="text-13" />
                {{ t('Last ban {when}', { when: bans.lastBan }) }}
            </li>
        </ul>
    </CollapsibleSection>
</template>
