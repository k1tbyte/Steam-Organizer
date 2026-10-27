<script setup lang="ts">
import type { LockScope } from '@so/core'
import {
    FpAlert,
    FpButton,
    FpChoice,
    FpChoiceGroup,
    FpFormField,
    FpIcon,
    FpInput,
    FpSwitch,
    tip,
} from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type Account, LevelAvatar } from '#features/accounts'
import type { LockDialogState } from '../../composables/lock/useLockDialog'

defineProps<{ account: Account; dialog: LockDialogState }>()

const { t } = useI18n()

const scopes = computed<{ value: LockScope; title: string; description: string }[]>(() => [
    {
        value: 'credentials',
        title: t('Credentials'),
        description: t('Login, password, phone, linked services and Steam Guard'),
    },
    {
        value: 'everything',
        title: t('Everything except nickname and avatar'),
        description: t('Level, IDs, stats, bans and the note are hidden too'),
    },
])
const noRecovery = computed(() =>
    t("Without recovery, a forgotten password means this account's secrets are gone for good."),
)
</script>

<template>
    <form id="lock-account" class="flex flex-col gap-4.5" @submit.prevent="dialog.lock">
        <div class="flex items-center gap-3 rounded bg-surface-hi px-3 py-2.5">
            <LevelAvatar size="sm" :name="account.nickname" :hue="account.hue" :avatar="account.avatar" :level="account.level" :anonymous="account.anonymous" />
            <div class="flex min-w-0 flex-1 flex-col gap-px">
                <span class="truncate font-semibold text-14 text-fg-1">{{ account.nickname }}</span>
                <span class="text-12.5 text-fg-3">{{ t('Asked every time, even with the vault unlocked') }}</span>
            </div>
        </div>

        <div class="flex flex-col gap-1.5">
            <span class="font-medium text-12.5 text-fg-2">{{ t('Account password') }}</span>
            <FpInput
                v-model="dialog.password"
                no-reveal
                :type="dialog.showPasswords ? 'text' : 'password'"
                :placeholder="t('PIN or passphrase')"
                :aria-label="t('Account password')">
                <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                <template #trailing>
                    <FpButton
                        v-bind="tip(dialog.showPasswords ? t('Hide') : t('Show'))"
                        square
                        size="xs"
                        variant="ghost"
                        :aria-label="dialog.showPasswords ? t('Hide') : t('Show')"
                        @click="dialog.showPasswords = !dialog.showPasswords">
                        <FpIcon :name="dialog.showPasswords ? 'icon-[lucide--eye-off]' : 'icon-[lucide--eye]'" />
                    </FpButton>
                </template>
            </FpInput>
            <FpFormField :error="dialog.mismatch">
                <FpInput
                    v-model="dialog.repeat"
                    no-reveal
                    :type="dialog.showPasswords ? 'text' : 'password'"
                    :valid="dialog.matches"
                    :placeholder="t('Repeat it')"
                    :aria-label="t('Repeat it')">
                    <template #leading><FpIcon name="icon-[lucide--repeat-2]" /></template>
                </FpInput>
            </FpFormField>
            <p v-if="dialog.mismatch" class="flex items-center gap-1.25 text-12 text-danger" role="alert">
                <FpIcon name="icon-[lucide--circle-alert]" class="text-13" />
                {{ t("Doesn't match") }}
            </p>
            <span class="text-12 text-fg-3">{{ t('Any length works, from a 4-digit PIN to a long passphrase.') }}</span>
        </div>

        <div class="flex flex-col gap-2">
            <span class="font-medium text-12.5 text-fg-2">{{ t('Hide behind it') }}</span>
            <FpChoiceGroup v-model="dialog.scope" class="flex flex-col gap-2">
                <FpChoice
                    v-for="scope in scopes"
                    :key="scope.value"
                    :value="scope.value"
                    class="flex w-full items-start gap-3 p-3 data-[state=checked]:bg-accent-soft">
                    <span
                        class="mt-px grid size-4.5 shrink-0 place-items-center rounded-full ring-[1.5px] ring-stroke-2 ring-inset in-data-[state=checked]:ring-accent">
                        <span class="size-2 rounded-full in-data-[state=checked]:bg-accent" />
                    </span>
                    <span class="flex min-w-0 flex-col gap-0.5">
                        <span class="font-semibold text-13.5 text-fg-1">{{ scope.title }}</span>
                        <span class="text-12.5 text-fg-3">{{ scope.description }}</span>
                    </span>
                </FpChoice>
            </FpChoiceGroup>
        </div>

        <div class="flex flex-col gap-2">
            <FpSwitch
                v-model="dialog.recovery"
                :label="t('Recover with master password')"
                :description="t('If you forget this password, the master password opens the account')" />
            <FpAlert v-if="!dialog.recovery" color="danger" :description="noRecovery" />
        </div>
    </form>
</template>
