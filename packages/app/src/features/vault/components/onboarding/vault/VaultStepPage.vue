<script setup lang="ts">
import {
    FpAlert,
    FpAvatar,
    FpButton,
    FpChoiceGroup,
    FpIcon,
    FpInput,
    FpLabel,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useOnboardingFrame } from '../../../composables/onboarding/useOnboardingFrame'
import { useVaultStep } from '../../../composables/onboarding/useVaultStep'
import { MAX_VAULT_NAME_LENGTH } from '../../../model'
import OnboardingStep from '../OnboardingStep.vue'
import StorageChoice from './StorageChoice.vue'

const { t } = useI18n()
const { desktop, fieldSize, buttonSize } = useOnboardingFrame()
const {
    draft,
    options,
    account,
    signedIn,
    connecting,
    folderPath,
    ready,
    signIn,
    changeAccount,
    toggleFolder,
    next,
} = useVaultStep()
</script>

<template>
    <OnboardingStep
        :title="t('Name your vault')"
        :description="
            desktop
                ? t('You can keep several vaults and pick one when unlocking.')
                : t('Pick one of several when unlocking.')
        "
        back="/welcome">
        <div class="flex flex-col gap-1.5">
            <FpLabel v-if="desktop" for="vault-name">{{ t('Vault name') }}</FpLabel>
            <FpInput
                id="vault-name"
                v-model="draft.name"
                :size="fieldSize"
                :maxlength="MAX_VAULT_NAME_LENGTH"
                :aria-label="t('Vault name')"
                :placeholder="t('Main vault')">
                <template #leading><FpIcon name="icon-[lucide--vault]" /></template>
            </FpInput>
        </div>

        <div class="flex flex-col gap-1.5">
            <FpLabel>{{ t('Where to keep it') }}</FpLabel>
            <FpChoiceGroup v-model="draft.location" class="flex flex-col gap-1.5">
                <StorageChoice v-for="option in options" :key="option.value" :option />
            </FpChoiceGroup>
        </div>

        <template v-if="draft.location === 'drive'">
            <FpButton
                v-if="!signedIn"
                block
                variant="soft"
                :size="buttonSize"
                :loading="connecting"
                @click="signIn">
                <FpIcon name="icon-[simple-icons--google]" aria-hidden="true" />
                {{ t('Sign in with Google') }}
            </FpButton>
            <div v-else class="flex h-13 items-center gap-3 rounded bg-surface-hi py-0 pr-1.5 pl-2.5">
                <FpAvatar round :alt="account?.name" />
                <span class="flex min-w-0 flex-1 flex-col gap-px">
                    <span class="truncate font-medium text-13.5 text-fg-1">{{ account?.email }}</span>
                    <span class="text-12 text-fg-3">
                        {{ t("The vault file goes to the app's Drive folder") }}
                    </span>
                </span>
                <FpButton variant="ghost" size="sm" @click="changeAccount">{{ t('Change') }}</FpButton>
            </div>
        </template>

        <template v-else-if="draft.location === 'folder'">
            <FpButton
                v-if="!draft.folderChosen"
                block
                variant="soft"
                :size="buttonSize"
                @click="toggleFolder">
                <FpIcon name="icon-[lucide--folder-search]" aria-hidden="true" />
                {{ t('Choose folder…') }}
            </FpButton>
            <div v-else class="flex h-13 items-center gap-3 rounded bg-surface-hi py-0 pr-1.5 pl-3">
                <FpIcon name="icon-[simple-icons--obsidian]" class="text-17 text-fg-2" aria-hidden="true" />
                <span class="flex min-w-0 flex-1 flex-col gap-px">
                    <span class="truncate font-medium font-mono text-13 text-fg-1">{{ folderPath }}</span>
                    <span class="text-12 text-fg-3">
                        {{ t('Sync it with Obsidian Sync, git or Syncthing') }}
                    </span>
                </span>
                <FpButton variant="ghost" size="sm" @click="toggleFolder">{{ t('Change') }}</FpButton>
            </div>
        </template>

        <FpAlert v-else>
            {{
                desktop
                    ? t('Only this browser has it. If the browser data is cleared, the vault is gone. You can move it to Google Drive later.')
                    : t('Only this browser has it. Clearing browser data deletes the vault.')
            }}
        </FpAlert>

        <template #cta>
            <FpButton block color="accent" :size="buttonSize" :disabled="!ready" @click="next">
                {{ t('Continue') }}
            </FpButton>
        </template>
    </OnboardingStep>
</template>
