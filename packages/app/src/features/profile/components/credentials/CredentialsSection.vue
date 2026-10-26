<script setup lang="ts">
import { FpButton, FpIcon, FpPopover, tip } from '@so/ui'
import { reactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { MAX_ACCOUNT_SERVICES, ServiceIcon } from '#features/linked-services'
import { useCredentials } from '../../composables/credentials/useCredentials'
import type { AccountGateState } from '../../composables/useAccountGate'
import type { AccountCredentials } from '../../model'
import AccountLockGate from '../lock/AccountLockGate.vue'
import CollapsibleSection from '../summary/CollapsibleSection.vue'
import CredentialRow from './CredentialRow.vue'
import ServiceEditorDialog from './ServiceEditorDialog.vue'
import SteamPasswordDialog from './SteamPasswordDialog.vue'

const props = defineProps<{
    accountId: string
    credentials: AccountCredentials
    gate: AccountGateState
    touch: boolean
}>()
const emit = defineEmits<{ lock: [] }>()

const { t } = useI18n()
const creds = reactive(
    useCredentials(
        () => props.accountId,
        () => props.credentials,
    ),
)
const confirming = shallowRef(false)
function remove() {
    confirming.value = false
    creds.removeSelected()
}
</script>

<template>
    <CollapsibleSection section="credentials" :title="t('Credentials')" icon="icon-[lucide--key-round]">
        <template v-if="!gate.chip" #meta>
            <span class="font-mono font-normal text-12 text-fg-3">{{ creds.count }}</span>
        </template>
        <template #actions>
            <FpButton v-if="gate.canRelock && !touch" v-bind="tip(t('Lock this account again'))" size="xs" variant="ghost" @click="gate.relock">
                <FpIcon name="icon-[lucide--lock-keyhole]" />
                {{ t('Lock now') }}
            </FpButton>
            <FpButton v-else-if="!gate.chip && !touch" v-bind="tip(t('Protect with its own password'))" size="xs" variant="ghost" @click="emit('lock')">
                <FpIcon name="icon-[lucide--lock-keyhole]" />
                {{ t('Lock') }}
            </FpButton>
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
                    <ServiceIcon :service="service.service" />
                    {{ service.service.name }}
                </FpButton>
                <!-- The tip sits on a wrapper: a disabled button takes no pointer events. -->
                <span
                    v-if="!gate.canRelock"
                    v-bind="tip(creds.full ? t('Up to {max} services per account', { max: MAX_ACCOUNT_SERVICES }) : t('Add linked service'), { disabled: touch })"
                    class="shrink-0">
                    <FpButton
                        square
                        round
                        variant="outline"
                        :size="touch ? 'sm' : 'xs'"
                        :disabled="creds.full"
                        :aria-label="t('Add linked service')"
                        @click="creds.add">
                        <FpIcon name="icon-[lucide--plus]" />
                    </FpButton>
                </span>
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
                <FpPopover v-if="creds.removable" v-model:open="confirming" sheet width="16rem" placement="bottom-end" :label="t('Remove service')">
                    <FpButton :size="touch ? 'lg' : 'xs'" variant="ghost" class="hover:bg-danger-soft! hover:text-danger!">
                        <FpIcon name="icon-[lucide--trash-2]" />
                        {{ t('Remove') }}
                    </FpButton>
                    <template #content>
                        <div class="flex flex-col gap-3">
                            <div class="flex flex-col gap-1">
                                <span class="font-semibold text-13.5 text-fg-1">
                                    {{ t('Delete {name}?', { name: creds.selectedName }) }}
                                </span>
                                <span class="text-12.5 leading-snug text-fg-3">
                                    {{ t('Its login and password are removed from this account.') }}
                                </span>
                            </div>
                            <div class="flex justify-end gap-1.5">
                                <FpButton size="sm" variant="soft" :label="t('Cancel')" @click="confirming = false" />
                                <FpButton size="sm" color="danger" :label="t('Delete')" @click="remove" />
                            </div>
                        </div>
                    </template>
                </FpPopover>
                <FpButton :size="touch ? 'lg' : 'xs'" variant="soft" @click="creds.edit">
                    <FpIcon name="icon-[lucide--pencil]" />
                    {{ t('Edit') }}
                </FpButton>
            </div>
        </div>
    </CollapsibleSection>
    <SteamPasswordDialog v-model:open="creds.passwordOpen" :account-id="accountId" />
    <ServiceEditorDialog
        v-model:open="creds.editorOpen"
        :account-id="accountId"
        :linked="credentials.linked"
        :editing="creds.editing" />
</template>
