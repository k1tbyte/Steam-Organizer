<script setup lang="ts">
import { FpButton, FpDropdownMenu, FpIcon, FpInput, FpKbd, FpTooltip, useDesktopLayout } from '@so/ui'
import { onKeyStroke } from '@vueuse/core'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageActive } from '#core'

import { useAccountsFilters } from '../../composables/useAccountsFilters'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { query, setQuery, searchField, fieldItems } = useAccountsFilters()

const input = useTemplateRef('input')
// Stays mounted while Accounts is hidden: the shortcut belongs to the current page only.
const active = usePageActive()
onKeyStroke('k', (event) => {
    if (!active.value || (!event.metaKey && !event.ctrlKey)) return
    event.preventDefault()
    input.value?.focus()
})
</script>

<template>
    <FpInput
        ref="input"
        :model-value="query"
        :placeholder="desktop ? t('Search accounts…') : t('Search…')"
        @update:model-value="setQuery(String($event))">
        <template #leading>
            <FpIcon name="icon-[lucide--search]" />
        </template>
        <template #trailing>
            <FpDropdownMenu :items="fieldItems" placement="bottom-end">
                <FpTooltip :text="t('Search in')">
                    <FpButton size="xs" variant="soft" class="-mr-1.5">
                        <template v-if="desktop">{{ t('in') }}</template>
                        <span class="font-medium text-fg-1">{{ searchField }}</span>
                        <FpIcon name="icon-[lucide--chevron-down]" />
                    </FpButton>
                </FpTooltip>
            </FpDropdownMenu>
            <FpKbd v-if="desktop" value="⌘K" size="md" class="ml-2" />
        </template>
    </FpInput>
</template>
