<script setup lang="ts">
import { FpAlert, FpButton, FpFormField, FpIcon, FpInput, FpShake, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import FieldNote from '../FieldNote.vue'

defineProps<{ message: string; attempts: number; pinLocked: boolean; canUsePin: boolean }>()
defineEmits<{ submit: []; usePin: []; reset: [] }>()

const password = defineModel<string>({ required: true })
const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<template>
    <div v-if="desktop" class="flex flex-col gap-2">
        <FpAlert v-if="pinLocked" color="warning">
            {{ t('Too many wrong PINs. Unlock with the master password once.') }}
        </FpAlert>
        <FpShake :trigger="attempts">
            <FpFormField :error="message !== ''">
                <FpInput
                    v-model="password"
                    type="password"
                    no-reveal
                    size="lg"
                    :aria-label="t('Master password')"
                    :placeholder="t('Master password')"
                    @keydown.enter="$emit('submit')">
                    <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                    <template #trailing>
                        <FpButton color="accent" size="xl" class="-mr-2.5" @click="$emit('submit')">
                            {{ t('Unlock') }}
                        </FpButton>
                    </template>
                </FpInput>
            </FpFormField>
        </FpShake>
        <FieldNote v-if="message">{{ message }}</FieldNote>
        <div class="flex items-center justify-center gap-1.5 pt-1.5 text-13 text-fg-3">
            {{ t('Forgot it?') }}
            <FpButton variant="link" color="danger" @click="$emit('reset')">
                {{ t('Reset vault') }}
            </FpButton>
        </div>
    </div>
    <div v-else class="flex min-h-0 flex-1 flex-col justify-center gap-3 px-5 pb-10">
        <span class="self-center font-title text-20 text-fg-1">{{ t('Master password') }}</span>
        <FpAlert v-if="pinLocked" color="warning">
            {{ t('Too many wrong PINs. Use the master password once.') }}
        </FpAlert>
        <FpShake :trigger="attempts">
            <FpFormField :error="message !== ''">
                <FpInput
                    v-model="password"
                    type="password"
                    no-reveal
                    size="lg"
                    :aria-label="t('Master password')"
                    :placeholder="t('Master password')"
                    @keydown.enter="$emit('submit')">
                    <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                </FpInput>
            </FpFormField>
        </FpShake>
        <span v-if="message" class="text-12.5 text-danger leading-snug">{{ message }}</span>
        <FpButton block color="accent" size="2xl" @click="$emit('submit')">{{ t('Unlock') }}</FpButton>
        <FpButton v-if="canUsePin" variant="ghost" color="accent" size="xl" @click="$emit('usePin')">
            {{ t('Use PIN') }}
        </FpButton>
    </div>
</template>
