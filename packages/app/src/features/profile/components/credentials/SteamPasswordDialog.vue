<script setup lang="ts">
import { FpAlert, FpButton, FpFormField, FpIcon, FpInput, FpModal, FpSegmentedMeter, tip } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSteamPassword } from '../../composables/credentials/useSteamPassword'

const props = defineProps<{ accountId: string }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const view = reactive(useSteamPassword(() => props.accountId, open))
</script>

<template>
    <FpModal v-model:open="open" :title="t('Steam password')" width="min(92vw, 27rem)">
        <form id="steam-password" class="flex flex-col gap-4" @submit.prevent="view.save">
            <div class="flex flex-col gap-2.5">
                <FpFormField :label="t('New password')">
                    <FpInput
                        v-model="view.password"
                        :type="view.shown ? 'text' : 'password'"
                        no-reveal
                        autocomplete="new-password"
                        class="font-mono">
                        <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                        <template #trailing>
                            <FpButton
                                v-bind="tip(view.shown ? t('Hide') : t('Show'), { label: true })"
                                square
                                size="xs"
                                variant="ghost"
                                @click="view.shown = !view.shown">
                                <FpIcon :name="view.shown ? 'icon-[lucide--eye-off]' : 'icon-[lucide--eye]'" />
                            </FpButton>
                            <FpButton v-bind="tip(t('Generate'), { label: true })" square size="xs" variant="ghost" @click="view.generate">
                                <FpIcon name="icon-[lucide--dices]" />
                            </FpButton>
                        </template>
                    </FpInput>
                </FpFormField>
                <FpSegmentedMeter :value="view.strength.level" :tone="view.strength.tone" :label="view.strength.label" />
            </div>
            <FpAlert :description="t('This updates the copy in the vault. Change it on Steam first, then save here.')" />
        </form>
        <template #footer>
            <FpButton
                as="a"
                href="https://store.steampowered.com/account/"
                target="_blank"
                rel="noopener"
                size="lg"
                variant="ghost"
                class="mr-auto text-accent-ink!">
                {{ t('Open Steam') }}
                <FpIcon name="icon-[lucide--arrow-up-right]" />
            </FpButton>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="open = false" />
            <FpButton
                size="lg"
                type="submit"
                form="steam-password"
                color="accent"
                :disabled="!view.canSave"
                :loading="view.saving"
                :label="t('Save')" />
        </template>
    </FpModal>
</template>
