<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpIconTile, FpInput } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { AccountGateState } from '../../composables/lock/useAccountGate'

defineProps<{
    gate: AccountGateState
    touch: boolean
    /** The whole page stands behind it: its own title, inside a card the caller draws. */
    standalone?: boolean
}>()

const { t } = useI18n()
</script>

<template>
    <div
        class="flex flex-col gap-3.5"
        :class="standalone ? 'mx-auto w-full max-w-sm items-center py-4 text-center' : 'px-4 pt-0.5 pb-4.5 max-lg:px-3 max-lg:pb-4'">
        <div class="flex gap-3" :class="standalone ? 'flex-col items-center' : 'items-start'">
            <FpIconTile name="icon-[lucide--lock-keyhole]" color="accent" :size="standalone ? 'lg' : 'md'" />
            <div class="flex min-w-0 flex-col gap-1">
                <span class="font-semibold text-14 text-fg-1 max-lg:text-15">
                    {{ standalone ? t('This account is locked') : t('Locked with its own password') }}
                </span>
                <span class="text-13 text-fg-3 leading-snug text-pretty">{{ gate.scopeText }}</span>
            </div>
        </div>

        <template v-if="gate.recoveryOff">
            <div class="flex items-start gap-2.5 rounded bg-danger-soft p-3.5 text-left">
                <FpIcon name="icon-[lucide--circle-alert]" class="mt-0.5 text-18 text-danger" />
                <div class="flex min-w-0 flex-col gap-1">
                    <span class="font-semibold text-14 text-fg-1">{{ t('Recovery is off for this account') }}</span>
                    <span class="text-13 text-fg-2 leading-snug text-pretty">
                        {{ t("The master password can't open it. Without this account's password its secrets can't be restored. You can still delete the account.") }}
                    </span>
                </div>
            </div>
            <FpButton
                variant="soft"
                :size="touch ? 'xl' : 'lg'"
                :label="t('Use account password')"
                @click="gate.switchMode" />
        </template>

        <form v-else class="flex w-full flex-col gap-2.5" @submit.prevent="gate.unlock">
            <p class="text-12.5 text-fg-3 leading-snug" :class="!standalone && 'text-left'">{{ gate.note }}</p>
            <div class="flex flex-col gap-2" :class="!standalone && 'lg:flex-row lg:items-start'">
                <FpFormField class="min-w-0 flex-1 text-left" :error="gate.error">
                    <FpInput
                        v-model="gate.password"
                        type="password"
                        no-reveal
                        :size="touch || standalone ? 'lg' : 'md'"
                        :placeholder="gate.placeholder"
                        :aria-label="gate.placeholder"
                        @input="gate.clearError">
                        <template #leading>
                            <FpIcon v-if="gate.usesMaster" name="icon-[lucide--lock-keyhole]" />
                            <FpIcon v-else name="icon-[lucide--key-round]" />
                        </template>
                    </FpInput>
                </FpFormField>
                <FpButton
                    type="submit"
                    color="accent"
                    :size="touch ? 'xl' : 'lg'"
                    :block="standalone"
                    :loading="gate.busy"
                    :label="t('Unlock')" />
            </div>
            <FpButton
                class="self-center"
                :class="!standalone && 'lg:self-end'"
                variant="link"
                color="accent"
                :size="touch ? 'xl' : 'xs'"
                :label="gate.switchLabel"
                @click="gate.switchMode" />
        </form>
    </div>
</template>
