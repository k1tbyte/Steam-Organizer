<script setup lang="ts">
import { FpButton, FpIcon, FpTooltip } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AccountGateState } from '../../composables/useAccountGate'
import { useCredentials } from '../../composables/useCredentials'
import type { CredentialService } from '../../model'
import AccountLockGate from '../lock/AccountLockGate.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import CredentialRow from './CredentialRow.vue'

const MAX_SERVICES = 7

const props = defineProps<{
    services: CredentialService[]
    gate: AccountGateState
    touch: boolean
}>()
const emit = defineEmits<{ lock: []; addService: []; edit: []; removeService: [] }>()

const { t } = useI18n()
const creds = reactive(useCredentials(() => props.services))
</script>

<template>
    <CollapsibleSection section="credentials" :title="t('Credentials')" icon="icon-[lucide--key-round]">
        <template v-if="!gate.chip" #meta>
            <span class="font-mono font-normal text-12 text-fg-3">{{ creds.count }}</span>
        </template>
        <template #actions>
            <FpTooltip v-if="gate.canRelock && !touch" :text="t('Lock this account again')">
                <FpButton size="xs" variant="ghost" @click="gate.relock">
                    <FpIcon name="icon-[lucide--lock-keyhole]" />
                    {{ t('Lock now') }}
                </FpButton>
            </FpTooltip>
            <FpTooltip v-else-if="!gate.chip && !touch" :text="t('Protect with its own password')">
                <FpButton size="xs" variant="ghost" @click="emit('lock')">
                    <FpIcon name="icon-[lucide--lock-keyhole]" />
                    {{ t('Lock') }}
                </FpButton>
            </FpTooltip>
        </template>

        <AccountLockGate v-if="gate.locked" :gate="gate" :touch="touch" />
        <div v-else class="flex flex-col gap-3.5 px-4 pb-4 max-lg:gap-3 max-lg:px-3 max-lg:pb-3.5">
            <div class="flex items-center gap-1.5 max-lg:-mx-3 max-lg:overflow-x-auto max-lg:px-3 lg:flex-wrap">
                <FpButton
                    v-for="service in creds.services"
                    :key="service.key"
                    round
                    class="shrink-0"
                    :size="touch ? 'sm' : 'xs'"
                    :variant="service.selected ? 'soft' : 'outline'"
                    :color="service.selected ? 'accent' : 'neutral'"
                    @click="creds.select(service.key)">
                    <FpIcon :name="service.icon" />
                    {{ service.label }}
                </FpButton>
                <FpTooltip
                    v-if="!gate.canRelock"
                    :text="t('Add linked service (up to {max})', { max: MAX_SERVICES })"
                    :disabled="touch">
                    <FpButton
                        square
                        round
                        variant="outline"
                        class="shrink-0"
                        :size="touch ? 'sm' : 'xs'"
                        :disabled="creds.count >= MAX_SERVICES"
                        :aria-label="t('Add linked service (up to {max})', { max: MAX_SERVICES })"
                        @click="emit('addService')">
                        <FpIcon name="icon-[lucide--plus]" />
                    </FpButton>
                </FpTooltip>
            </div>
            <div class="flex flex-col gap-1.5 max-lg:gap-3">
                <CredentialRow
                    v-for="field in creds.fields"
                    :key="field.id"
                    :field="field"
                    :touch="touch"
                    @toggle-reveal="creds.toggleReveal(field.id)" />
            </div>
            <p
                v-if="gate.canRelock"
                class="flex items-center gap-1.5 border-stroke-1 border-t border-dashed pt-3 text-12 text-fg-3">
                <FpIcon name="icon-[lucide--timer]" class="text-13" />
                {{ t('Locks again when you leave this account or lock the vault') }}
            </p>
            <div v-else class="flex items-center gap-1 border-stroke-1 border-t border-dashed pt-3 max-lg:gap-1.5 max-lg:pt-2.5">
                <span class="min-w-0 flex-1 text-12 text-fg-3">{{ creds.hint }}</span>
                <FpButton
                    v-if="creds.removable && !touch"
                    size="xs"
                    variant="ghost"
                    class="hover:bg-danger-soft! hover:text-danger!"
                    @click="emit('removeService')">
                    <FpIcon name="icon-[lucide--trash-2]" />
                    {{ t('Remove') }}
                </FpButton>
                <FpButton :size="touch ? 'lg' : 'xs'" variant="soft" @click="emit('edit')">
                    <FpIcon name="icon-[lucide--pencil]" />
                    {{ t('Edit') }}
                </FpButton>
            </div>
        </div>
    </CollapsibleSection>
</template>
