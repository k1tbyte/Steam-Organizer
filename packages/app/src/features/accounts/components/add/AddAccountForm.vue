<script setup lang="ts">
import { FpBadge, FpFormField, FpIcon, FpInput, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { AddAccountFormState } from '../../composables/useAddAccountForm'
import MaFileField from './MaFileField.vue'
import SteamLookupResult from './SteamLookupResult.vue'

defineProps<{ form: AddAccountFormState }>()
defineEmits<{ submit: [] }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<!-- Footer buttons outside the form submit it through `form="add-account"`. -->
<template>
    <form id="add-account" class="flex flex-col gap-4.5 lg:gap-4" @submit.prevent="$emit('submit')">
        <FpFormField :label="t('Login')" :error="form.loginError">
            <FpInput v-model="form.login" :size="desktop ? 'md' : 'lg'" :placeholder="t('Steam account name')">
                <template #leading><FpIcon name="icon-[lucide--user-round]" /></template>
            </FpInput>
        </FpFormField>
        <FpFormField :label="t('Password')" :error="form.passwordError">
            <FpInput
                v-model="form.password"
                type="password"
                :size="desktop ? 'md' : 'lg'"
                :placeholder="t('At least 6 characters')">
                <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
            </FpInput>
        </FpFormField>
        <div class="flex flex-col gap-1.5">
            <FpFormField :label="t('Steam profile')" :hint="t('Optional')" :error="form.steamIdMessage">
                <FpInput
                    v-model="form.steamId"
                    class="font-mono"
                    :size="desktop ? 'md' : 'lg'"
                    :placeholder="t('ID, SteamID64, profile URL or vanity name')">
                    <template #leading><FpIcon name="icon-[lucide--link-2]" /></template>
                    <template v-if="form.formatLabel" #trailing>
                        <FpBadge :label="form.formatLabel" color="accent" />
                    </template>
                </FpInput>
            </FpFormField>
            <SteamLookupResult :loading="form.showLookingUp" :profile="form.profile" />
        </div>
        <FpFormField :label="t('Steam Guard')" :hint="t('Optional')">
            <MaFileField :file-name="form.maFileName" @attach="form.attachMaFile" @remove="form.removeMaFile" />
        </FpFormField>
    </form>
</template>
