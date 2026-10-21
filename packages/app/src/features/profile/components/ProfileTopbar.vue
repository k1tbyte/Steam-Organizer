<script setup lang="ts">
import { FpButton, FpDropdownMenu, FpIcon, FpTooltip, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import PageTopbar from '#components/PageTopbar.vue'
import { SyncStatus } from '#features/backups'

import { type ProfileIntent, useProfileMenu } from '../composables/useProfileMenu'

const props = defineProps<{
    nickname: string
    hasLock: boolean
    refreshable: boolean
    editable: boolean
}>()
const emit = defineEmits<{ refresh: []; lock: []; intent: [kind: ProfileIntent] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const menu = useProfileMenu({
    hasLock: () => props.hasLock,
    editable: () => props.editable,
    lock: () => emit('lock'),
    intent: (kind) => emit('intent', kind),
})
</script>

<template>
    <PageTopbar :title="desktop ? nickname : ''">
        <template #back>
            <FpButton
                :as="RouterLink"
                to="/"
                :square="!desktop"
                :round="!desktop"
                :variant="desktop ? 'ghost' : 'soft'"
                :size="desktop ? 'sm' : 'xl'"
                :aria-label="t('Back to accounts')">
                <FpIcon name="icon-[lucide--chevron-left]" />
                <template v-if="desktop">{{ t('Accounts') }}</template>
            </FpButton>
            <span v-if="desktop" class="text-15 text-fg-faint">/</span>
        </template>
        <template v-if="desktop" #status><SyncStatus /></template>
        <template #actions>
            <FpTooltip v-if="refreshable && desktop" :text="t('Refresh from Steam')">
                <FpButton variant="soft" @click="emit('refresh')">
                    <FpIcon name="icon-[lucide--refresh-cw]" />
                    {{ t('Refresh') }}
                </FpButton>
            </FpTooltip>
            <FpButton
                v-else-if="refreshable"
                square
                round
                variant="ghost"
                size="xl"
                :aria-label="t('Refresh from Steam')"
                @click="emit('refresh')">
                <FpIcon name="icon-[lucide--refresh-cw]" />
            </FpButton>
            <FpDropdownMenu :items="menu.items.value" placement="bottom-end">
                <FpTooltip :text="t('More')" label>
                    <FpButton square :round="!desktop" variant="ghost" :size="desktop ? 'md' : 'xl'">
                        <FpIcon name="icon-[lucide--ellipsis]" />
                    </FpButton>
                </FpTooltip>
            </FpDropdownMenu>
        </template>
    </PageTopbar>
</template>
