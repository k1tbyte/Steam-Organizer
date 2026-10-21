<script setup lang="ts">
import { FpButton, FpDropdownMenu, FpIcon, FpInput, FpKbd, useDesktopLayout } from '@so/ui'
import { onKeyStroke } from '@vueuse/core'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAccountsFilters } from '../../composables/useAccountsFilters'

const { t } = useI18n()
const desktop = useDesktopLayout()
const { query, setQuery, searchField, fieldItems } = useAccountsFilters()

const input = useTemplateRef('input')
onKeyStroke('k', (event) => {
    if (!event.metaKey && !event.ctrlKey) return
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
                <FpButton size="xs" variant="soft" class="-mr-1.5" :title="t('Search in')">
                    <template v-if="desktop">{{ t('in') }}</template>
                    <span class="font-medium text-fg-1">{{ searchField }}</span>
                    <FpIcon name="icon-[lucide--chevron-down]" />
                </FpButton>
            </FpDropdownMenu>
            <FpKbd v-if="desktop" value="⌘K" size="md" class="ml-2" />
        </template>
    </FpInput>
</template>
