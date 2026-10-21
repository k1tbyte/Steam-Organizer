<script setup lang="ts">
import { FpButton, FpDrawer, FpModal, useDesktopLayout } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAddAccountForm } from '../../composables/useAddAccountForm'
import { useAddAccountOverlay } from '../../composables/useAddAccountOverlay'
import AddAccountForm from './AddAccountForm.vue'

const { t } = useI18n()
const desktop = useDesktopLayout()
const overlay = useAddAccountOverlay()
const form = reactive(useAddAccountForm(overlay.open))
</script>

<template>
    <FpModal
        v-if="desktop"
        v-model:open="overlay.open.value"
        :title="t('Add account')"
        width="min(92vw, 32.5rem)">
        <AddAccountForm :form="form" @submit="form.submit" />
        <template #footer-start>
            <span class="text-12 text-fg-3">{{ t('Steam data is fetched before saving') }}</span>
        </template>
        <template #footer>
            <FpButton variant="ghost" :label="t('Cancel')" @click="overlay.open.value = false" />
            <FpButton type="submit" form="add-account" color="accent" :disabled="!form.canAdd">
                {{ t('Add account') }}
                <span class="rounded bg-accent-fg/15 px-1 font-medium font-mono text-11">↵</span>
            </FpButton>
        </template>
    </FpModal>
    <FpDrawer v-else v-model:open="overlay.open.value" bare :title="t('Add account')">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center px-2 pb-2">
            <FpButton
                variant="ghost"
                size="lg"
                class="justify-self-start text-fg-2!"
                :label="t('Cancel')"
                @click="overlay.open.value = false" />
            <span class="font-semibold text-16 text-fg-1">{{ t('Add account') }}</span>
            <FpButton
                type="submit"
                form="add-account"
                variant="ghost"
                color="accent"
                size="lg"
                class="justify-self-end font-semibold!"
                :disabled="!form.canAdd"
                :label="t('Add')" />
        </div>
        <div class="min-h-[calc(100dvh-8rem)] px-4 pt-2 pb-6">
            <AddAccountForm :form="form" @submit="form.submit" />
        </div>
    </FpDrawer>
</template>
