<script setup lang="ts">
import {
    FpAsyncView,
    FpEmpty,
    FpIcon,
    FpToggleGroup,
    useDesktopLayout,
} from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { useI18n } from 'vue-i18n'

import { useUnlock } from '../../composables/useUnlock'
import BrandFrame from '../BrandFrame.vue'
import UnlockHello from './UnlockHello.vue'
import UnlockOpening from './UnlockOpening.vue'
import UnlockPassword from './UnlockPassword.vue'
import UnlockPin from './UnlockPin.vue'
import VaultPicker from './VaultPicker.vue'

const { t } = useI18n()
const desktop = useDesktopLayout()
const {
    status,
    vault,
    vaultRows,
    vaultIcon,
    pickerOpen,
    pickVault,
    methods,
    method,
    view,
    hasBio,
    canUsePin,
    pinLocked,
    pin,
    pinError,
    failedAttempts,
    onPinInput,
    pressDigit,
    pressDelete,
    password,
    passwordError,
    submitPassword,
    waitingForHello,
    startHello,
    switchToPassword,
    switchToPin,
    addVault,
    removeFromDevice,
    resetVault,
} = useUnlock()
</script>

<template>
    <BrandFrame>
        <FpAsyncView :status class="min-h-0 flex-1 justify-center">
            <div
                :class="
                    desktop
                        ? 'flex w-100 max-w-full flex-col gap-4'
                        : 'flex min-h-0 flex-1 flex-col'
                ">
                <div v-if="desktop" class="flex flex-col items-center gap-3.5 pb-1.5 text-center">
                    <span class="surface grid size-16 place-items-center rounded">
                        <img :src="logoUrl" alt="" class="size-8.5" />
                    </span>
                    <h2 class="font-title text-26 text-fg-1 leading-[1.15]">{{ t('Welcome back') }}</h2>
                </div>

                <div :class="!desktop && 'flex shrink-0 justify-center px-5 pt-4'">
                    <VaultPicker
                        v-model:open="pickerOpen"
                        :rows="vaultRows"
                        :current="vault"
                        :current-icon="vaultIcon"
                        @pick="pickVault"
                        @add="addVault"
                        @remove="removeFromDevice" />
                </div>

                <FpToggleGroup
                    v-if="desktop && methods.length > 1"
                    v-model="method"
                    block
                    size="lg"
                    :items="methods">
                    <template #default="{ option }">
                        <span class="flex items-center gap-1.5 whitespace-nowrap">
                            <FpIcon :name="option.icon ?? ''" class="text-15" aria-hidden="true" />
                            {{ option.label }}
                        </span>
                    </template>
                </FpToggleGroup>

                <UnlockHello
                    v-if="view === 'bio'"
                    :waiting="waitingForHello"
                    @start="startHello" />
                <UnlockPin
                    v-else-if="view === 'pin'"
                    :pin
                    :message="pinError"
                    :attempts="failedAttempts"
                    :has-bio="hasBio"
                    :waiting="waitingForHello"
                    @input="onPinInput"
                    @digit="pressDigit"
                    @delete="pressDelete"
                    @bio="startHello"
                    @use-password="switchToPassword" />
                <UnlockPassword
                    v-else-if="view === 'pw'"
                    v-model="password"
                    :message="passwordError"
                    :attempts="failedAttempts"
                    :pin-locked="pinLocked"
                    :can-use-pin="canUsePin"
                    @submit="submitPassword"
                    @use-pin="switchToPin"
                    @reset="resetVault" />
                <UnlockOpening v-else :vault-name="vault?.name ?? ''" />
            </div>

            <template #empty>
                <FpEmpty
                    :title="t('No vault on this device')"
                    :description="t('Create or restore a vault to get started.')">
                    <template #leading><FpIcon name="icon-[lucide--vault]" /></template>
                </FpEmpty>
            </template>
        </FpAsyncView>
    </BrandFrame>
</template>
