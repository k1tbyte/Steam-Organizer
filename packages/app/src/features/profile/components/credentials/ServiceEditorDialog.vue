<script setup lang="ts">
import type { ServiceCredentials } from '@so/core'
import { FpButton, FpFormField, FpIcon, FpInput, FpModal } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { ServicePicker } from '#features/linked-services'
import { useServiceEditor } from '../../composables/credentials/useServiceEditor'

const props = defineProps<{ accountId: string; linked: readonly ServiceCredentials[]; editing: string | null }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const view = reactive(useServiceEditor(props, open))
</script>

<template>
    <FpModal
        v-model:open="open"
        :title="view.adding ? t('Add service') : t('Edit service')"
        :description="view.adding ? view.count : undefined"
        width="min(92vw, 27rem)">
        <form id="service-editor" class="flex flex-col gap-4" @submit.prevent="view.save">
            <FpFormField :label="t('Service')">
                <ServicePicker v-model="view.service" :taken="view.taken" />
            </FpFormField>
            <FpFormField :label="t('Fields')">
                <div class="flex flex-wrap gap-1.5">
                    <FpButton
                        v-for="chip in view.chips"
                        :key="chip.kind"
                        round
                        size="xs"
                        :variant="chip.on ? 'soft' : 'outline'"
                        :aria-pressed="chip.on"
                        @click="view.toggle(chip.kind)">
                        <FpIcon :name="chip.icon" />
                        {{ chip.label }}
                    </FpButton>
                </div>
            </FpFormField>
            <div v-if="view.inputs.length > 0" class="flex flex-col gap-2">
                <FpFormField v-for="input in view.inputs" :key="input.kind" :error="input.error">
                    <FpInput
                        v-model="view.values[input.kind]"
                        :type="input.type"
                        :aria-label="input.label"
                        :placeholder="t(input.placeholder)">
                        <template #leading>
                            <span class="flex items-center gap-2">
                                <FpIcon :name="input.icon" />
                                <span class="w-21 text-12.5">{{ input.label }}</span>
                            </span>
                        </template>
                    </FpInput>
                </FpFormField>
            </div>
        </form>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="open = false" />
            <FpButton
                size="lg"
                type="submit"
                form="service-editor"
                color="accent"
                :disabled="!view.canSave"
                :loading="view.saving"
                :label="view.adding ? t('Add service') : t('Save')" />
        </template>
    </FpModal>
</template>
