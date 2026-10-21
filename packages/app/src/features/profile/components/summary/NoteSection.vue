<script setup lang="ts">
import { FpTextarea } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import { useProfileNote } from '../../composables/useProfileNote'
import { NOTE_MAX_LENGTH } from '../../model'
import CollapsibleSection from './CollapsibleSection.vue'

const props = defineProps<{ account: Account }>()

const { t } = useI18n()
const { note, count } = useProfileNote(() => props.account)
</script>

<template>
    <CollapsibleSection section="note" :title="t('Note')" icon="icon-[lucide--sticky-note]">
        <template #actions>
            <span class="pointer-events-none font-mono text-12 text-fg-3">{{ count }}</span>
        </template>
        <div class="px-3 pb-3 lg:px-4 lg:pb-4">
            <FpTextarea
                v-model="note"
                :rows="3"
                :maxlength="NOTE_MAX_LENGTH"
                :placeholder="t('Add a note…')"
                :aria-label="t('Note')"
                size="md" />
        </div>
    </CollapsibleSection>
</template>
