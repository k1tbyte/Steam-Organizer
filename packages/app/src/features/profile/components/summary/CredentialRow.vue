<script setup lang="ts">
import { FpButton, FpIcon, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useCopyFeedback } from '#core'

import type { CredentialsState } from '../../composables/credentials/useCredentials'

const props = defineProps<{ field: CredentialsState['fields'][number]; touch: boolean }>()
const emit = defineEmits<{ toggleReveal: [] }>()

const { t } = useI18n()
const { copied, copy } = useCopyFeedback()
</script>

<template>
    <div class="grid items-center gap-x-3 gap-y-1.25 lg:grid-cols-[5.5rem_minmax(0,1fr)]">
        <span class="pl-0.5 text-12.5 text-fg-3 lg:pl-0">{{ field.label }}</span>
        <div class="flex h-9.5 items-center gap-0.5 rounded bg-surface-hi pr-1 pl-3 max-lg:h-12 max-lg:pr-0.5 max-lg:pl-3.5">
            <span
                class="min-w-0 flex-1 truncate font-medium font-mono text-13"
                :class="!field.shown && 'tracking-[0.08em]'">
                {{ field.display }}
            </span>
            <FpButton
                v-if="field.secret"
                v-bind="tip(field.shown ? t('Hide') : t('Show'), { label: true, disabled: touch })"
                square
                variant="ghost"
                :size="touch ? 'md' : 'xs'"
                @click="emit('toggleReveal')">
                <FpIcon :name="field.shown ? 'icon-[lucide--eye-off]' : 'icon-[lucide--eye]'" />
            </FpButton>
            <FpButton
                v-bind="tip(t('Copy'), { label: true, disabled: touch })"
                square
                variant="ghost"
                :size="touch ? 'md' : 'xs'"
                :class="copied && 'text-success!'"
                @click="copy(props.field.value)">
                <FpIcon :name="copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
            </FpButton>
        </div>
    </div>
</template>
