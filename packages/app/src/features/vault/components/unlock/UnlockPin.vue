<script setup lang="ts">
import { FpButton, FpFormField, FpPinInput, FpShake, useDesktopLayout } from '@so/ui'
import { onMounted, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { PIN_LENGTH } from '../../services/pinAttempts'
import FieldNote from '../FieldNote.vue'
import PinKeypad from './PinKeypad.vue'

const props = defineProps<{
    pin: string
    message: string
    attempts: number
    hasBio: boolean
    waiting: boolean
}>()
defineEmits<{
    input: [pin: string]
    digit: [digit: string]
    delete: []
    bio: []
    usePassword: []
}>()

const { t } = useI18n()
const desktop = useDesktopLayout()
const cells = useTemplateRef('cells')

// A cleared pin means a fresh start: typing goes into the first cell again.
onMounted(() => cells.value?.focus())
watch(
    () => props.pin,
    (pin) => {
        if (pin === '') cells.value?.focus()
    },
)
</script>

<template>
    <div v-if="desktop" class="flex flex-col gap-2.5">
        <FpShake :trigger="attempts">
            <FpFormField :error="message !== ''">
                <FpPinInput
                    ref="cells"
                    masked
                    size="lg"
                    :length="PIN_LENGTH"
                    :model-value="pin"
                    @update:model-value="$emit('input', $event)" />
            </FpFormField>
        </FpShake>
        <FieldNote v-if="message">{{ message }}</FieldNote>
        <div class="flex items-center justify-center gap-1.5 text-12.5 text-fg-3">
            {{ t('6-digit PIN for this device') }}
            <span class="size-0.75 rounded-full bg-fg-faint" />
            <FpButton variant="link" color="accent" @click="$emit('usePassword')">
                {{ t('Forgot PIN?') }}
            </FpButton>
        </div>
    </div>
    <div v-else class="flex min-h-0 flex-1 flex-col">
        <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3.5 px-5">
            <span class="font-title text-20 text-fg-1">{{ t('Enter PIN') }}</span>
            <FpShake :trigger="attempts" class="flex gap-3.5 py-1">
                <span
                    v-for="index in PIN_LENGTH"
                    :key="index"
                    class="size-3.5 rounded-full ring-[1.5px] ring-inset transition-colors duration-press"
                    :class="[
                        message ? 'ring-danger' : 'ring-stroke-2',
                        index <= pin.length && 'bg-fg-1',
                    ]" />
            </FpShake>
            <span class="min-h-5 max-w-75 text-center text-12.5 text-danger leading-snug">{{ message }}</span>
        </div>
        <PinKeypad
            class="shrink-0 pb-4.5"
            :has-bio
            :waiting
            @digit="$emit('digit', $event)"
            @delete="$emit('delete')"
            @bio="$emit('bio')" />
        <div class="safe-pb flex shrink-0 justify-center pb-1.5">
            <FpButton variant="ghost" color="accent" size="xl" @click="$emit('usePassword')">
                {{ t('Use master password') }}
            </FpButton>
        </div>
    </div>
</template>
