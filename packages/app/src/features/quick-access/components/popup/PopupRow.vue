<script setup lang="ts">
import { FpButton, FpIcon, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import PickerRow from '../picker/PickerRow.vue'
import GuardPeek from './GuardPeek.vue'

defineProps<{
    account: Account
    selected: boolean
    concealed: boolean
    copiedLogin: boolean
    copiedPassword: boolean
}>()

defineEmits<{
    hover: []
    choose: []
    copyLogin: []
    copyPassword: []
    openApp: []
    unlock: []
}>()

const { t } = useI18n()
</script>

<!-- Actions show on the selected row only: the popup reads as a palette, not a toolbar per row. -->
<template>
    <PickerRow
        :account
        :selected
        :concealed
        @hover="$emit('hover')"
        @choose="$emit('choose')">
        <GuardPeek
            v-if="account.guard"
            :seed="account.id"
            :locked="concealed"
            @unlock="$emit('unlock')" />
        <div v-if="selected" class="flex shrink-0 gap-px">
            <FpButton v-bind="tip(t('Copy login'), { label: true })" square size="xs" variant="ghost" @click.stop="$emit('copyLogin')">
                <FpIcon :name="copiedLogin ? 'icon-[lucide--check]' : 'icon-[lucide--user-round]'" />
            </FpButton>
            <FpButton v-bind="tip(t('Copy password'), { label: true })" square size="xs" variant="ghost" @click.stop="$emit('copyPassword')">
                <FpIcon :name="copiedPassword ? 'icon-[lucide--check]' : 'icon-[lucide--key-round]'" />
            </FpButton>
            <FpButton v-bind="tip(t('Open in app'), { label: true })" square size="xs" variant="ghost" @click.stop="$emit('openApp')">
                <FpIcon name="icon-[lucide--arrow-up-right]" />
            </FpButton>
        </div>
    </PickerRow>
</template>
