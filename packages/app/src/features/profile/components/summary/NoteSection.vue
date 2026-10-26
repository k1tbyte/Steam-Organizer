<script setup lang="ts">
import { FpTextarea } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import { useProfileNote } from '../../composables/useProfileNote'
import { NOTE_MAX_LENGTH } from '../../model'
import CollapsibleSection from './CollapsibleSection.vue'

const props = defineProps<{ account: Account }>()

const { t } = useI18n()
const { note, count, status, faded, save, retry } = useProfileNote(() => props.account)
</script>

<template>
    <CollapsibleSection section="note" :title="t('Note')" icon="icon-[lucide--sticky-note]">
        <template #actions>
            <span class="flex items-center gap-3 text-12">
                <span v-if="status === 'failed'" class="text-danger">
                    {{ t('Not saved') }} ·
                    <button type="button" class="cursor-pointer font-medium hover:underline" @click="retry">{{ t('Retry') }}</button>
                </span>
                <span v-else-if="status === 'saving'" class="text-fg-3">{{ t('Saving…') }}</span>
                <span v-else-if="status === 'saved'" class="text-fg-3 transition-opacity duration-slow" :class="faded && 'opacity-0'">
                    {{ t('Saved') }}
                </span>
                <span class="font-mono text-fg-3">{{ count }}</span>
            </span>
        </template>
        <div class="px-3 pb-3 lg:px-4 lg:pb-4">
            <FpTextarea
                v-model="note"
                :rows="3"
                :maxlength="NOTE_MAX_LENGTH"
                :placeholder="t('Add a note…')"
                :aria-label="t('Note')"
                size="md"
                @blur="save" />
        </div>
    </CollapsibleSection>
</template>
