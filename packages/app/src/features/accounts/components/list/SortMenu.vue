<script setup lang="ts">
import { FpButton, FpDropdownMenu, FpIcon, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useAccountsFilters } from '../../composables/useAccountsFilters'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { sortItems, sortLabel, descending } = useAccountsFilters()
</script>

<template>
    <FpDropdownMenu :items="sortItems" placement="bottom-start">
        <FpButton v-if="desktop" round size="xs" variant="outline" class="shrink-0">
            {{ t('Sort:') }}
            <span class="font-medium text-fg-1">{{ sortLabel }}</span>
            <FpIcon :name="descending ? 'icon-[lucide--arrow-down]' : 'icon-[lucide--arrow-up]'" />
        </FpButton>
        <FpButton v-else round size="xs" variant="soft" class="shrink-0 text-fg-1!" :title="t('Sort')">
            <FpIcon
                :name="
                    descending
                        ? 'icon-[lucide--arrow-down-wide-narrow]'
                        : 'icon-[lucide--arrow-up-narrow-wide]'
                " />
            {{ sortLabel }}
        </FpButton>
    </FpDropdownMenu>
</template>
