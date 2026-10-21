<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpIconTile, FpInput } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { AccountGateState } from '../../composables/useAccountGate'

defineProps<{
    gate: AccountGateState
    touch: boolean
    /** The whole page stands behind it: its own title, inside a card the caller draws. */
    standalone?: boolean
}>()

const { t } = useI18n()
</script>

<template>
    <div class="flex flex-col gap-3.5" :class="!standalone && 'px-4 pt-0.5 pb-4.5 max-lg:px-3 max-lg:pb-4'">
        <div class="flex items-start gap-3">
            <FpIconTile name="icon-[lucide--lock-keyhole]" color="accent" />
            <div class="flex min-w-0 flex-col gap-1">
                <span class="font-semibold text-14 text-fg-1 max-lg:text-15">
                    {{ standalone ? t('This account is locked') : t('Locked with its own password') }}
                </span>
                <span class="text-13 text-fg-3 leading-snug text-pretty">{{ gate.scopeText }}</span>
            </div>
        </div>

        <form v-if="gate.asksPassword" class="flex flex-col gap-3" @submit.prevent="gate.unlock">
            <div class="flex flex-col gap-2 lg:flex-row">
                <FpFormField class="min-w-0 flex-1" :error="gate.passwordError !== ''">
                    <FpInput
                        v-model="gate.password"
                        type="password"
                        no-reveal
                        :size="touch ? 'lg' : 'md'"
                        :placeholder="t('Account password')"
                        :aria-label="t('Account password')"
                        @input="gate.clearPasswordError">
                        <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                    </FpInput>
                </FpFormField>
                <FpButton
                    type="submit"
                    color="accent"
                    :size="touch ? 'xl' : 'lg'"
                    :loading="gate.busy"
                    :label="t('Unlock')" />
            </div>
            <div class="flex items-center gap-2 text-12.5 max-lg:flex-col max-lg:items-stretch">
                <span v-if="gate.passwordError" class="flex flex-1 items-center gap-1.5 text-danger" role="alert">
                    <FpIcon name="icon-[lucide--circle-alert]" class="text-14" />
                    {{ gate.passwordError }}
                </span>
                <span v-else class="flex-1" />
                <FpButton
                    variant="link"
                    color="accent"
                    :size="touch ? 'xl' : 'xs'"
                    :label="t('Forgot password?')"
                    @click="gate.showRecovery" />
            </div>
        </form>

        <form
            v-else-if="gate.recoveryOn"
            class="flex flex-col gap-2.5 rounded bg-surface-hi p-3"
            @submit.prevent="gate.recover">
            <p class="text-13 text-fg-2 leading-snug text-pretty">
                {{ t("Recovery is on for this account. Enter the vault's master password to open it, then set a new account password.") }}
            </p>
            <div class="flex flex-col gap-2 lg:flex-row">
                <FpFormField class="min-w-0 flex-1" :error="gate.masterError !== ''">
                    <FpInput
                        v-model="gate.masterPassword"
                        type="password"
                        no-reveal
                        :size="touch ? 'lg' : 'md'"
                        :placeholder="t('Master password')"
                        :aria-label="t('Master password')"
                        @input="gate.clearMasterError">
                        <template #leading><FpIcon name="icon-[lucide--vault]" /></template>
                    </FpInput>
                </FpFormField>
                <FpButton
                    type="submit"
                    color="accent"
                    :size="touch ? 'xl' : 'lg'"
                    :loading="gate.busy"
                    :label="t('Recover')" />
            </div>
            <div class="flex items-center gap-2 text-12.5">
                <span v-if="gate.masterError" class="flex flex-1 items-center gap-1.5 text-danger" role="alert">
                    <FpIcon name="icon-[lucide--circle-alert]" class="text-14" />
                    {{ gate.masterError }}
                </span>
                <span v-else class="flex-1" />
                <FpButton variant="link" :size="touch ? 'xl' : 'xs'" :label="t('Back')" @click="gate.backToPassword" />
            </div>
        </form>

        <template v-else>
            <div class="flex items-start gap-2.5 rounded bg-danger-soft p-3.5">
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
                :label="t('Try the password again')"
                @click="gate.backToPassword" />
        </template>
    </div>
</template>
