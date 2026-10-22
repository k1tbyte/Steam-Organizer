<script setup lang="ts">
import { FpButton, FpCard, FpCountdownRing, FpIcon, tip } from '@so/ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCopyFeedback } from '#core'
import { GUARD_PERIOD_S, useGuardCode } from '#features/steam-guard'

const props = defineProps<{ seed: string; revocationCode: string | null }>()
const emit = defineEmits<{ removeAuthenticator: [] }>()

const { t } = useI18n()
const { holding, handlers, copied, shown, remaining, copyCode } = useGuardCode(() => props.seed)
const seconds = computed(() => Math.ceil(remaining.value * GUARD_PERIOD_S))

const revealed = ref(false)
const revocation = useCopyFeedback()
</script>

<template>
    <div class="flex max-w-xl flex-col gap-u-4">
        <FpCard
            :title="t('Current code')"
            :description="t('Hold the code to show it. Copy works while it is hidden.')">
            <div class="flex items-center gap-2">
                <div class="flex h-14 min-w-0 flex-1 items-center overflow-hidden rounded bg-surface-hi">
                    <button
                        v-bind="{ ...handlers, ...tip(t('Hold to show the code')) }"
                        type="button"
                        class="flex h-full min-w-0 flex-1 cursor-pointer touch-none items-center gap-3 px-4 text-fg-1 transition-colors duration-fast select-none"
                        :class="holding && 'bg-accent-soft'">
                        <FpIcon
                            :name="holding ? 'icon-[lucide--eye]' : 'icon-[lucide--shield-check]'"
                            class="text-18 text-accent-ink" />
                        <span class="font-mono font-semibold text-26 tracking-[0.2em]">{{ shown }}</span>
                        <span class="flex-1" />
                        <span class="font-mono text-13 text-fg-3 tabular-nums">{{ t('{seconds}s', { seconds }) }}</span>
                        <FpCountdownRing :value="remaining" :size="18" />
                    </button>
                </div>
                <FpButton v-bind="tip(t('Copy code'), { label: true })" square size="xl" variant="soft" @click="copyCode">
                    <FpIcon :name="copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
                </FpButton>
            </div>
        </FpCard>

        <FpCard
            :title="t('Authenticator')"
            :description="t('Steam asks for the revocation code if the authenticator is lost. Keep it somewhere safe.')">
            <div v-if="revocationCode" class="flex items-center gap-0.5 rounded bg-surface-hi py-1 pr-1 pl-3.5">
                <span class="min-w-0 flex-1 truncate font-medium font-mono text-14" :class="!revealed && 'tracking-[0.08em]'">
                    {{ revealed ? revocationCode : '••••••' }}
                </span>
                <FpButton
                    v-bind="tip(revealed ? t('Hide') : t('Show'), { label: true })"
                    square
                    variant="ghost"
                    size="md"
                    @click="revealed = !revealed">
                    <FpIcon :name="revealed ? 'icon-[lucide--eye-off]' : 'icon-[lucide--eye]'" />
                </FpButton>
                <FpButton
                    v-bind="tip(t('Copy revocation code'), { label: true })"
                    square
                    variant="ghost"
                    size="md"
                    :class="revocation.copied.value && 'text-success!'"
                    @click="revocation.copy(revocationCode)">
                    <FpIcon :name="revocation.copied.value ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
                </FpButton>
            </div>
            <div class="flex">
                <FpButton variant="soft" color="danger" @click="emit('removeAuthenticator')">
                    <FpIcon name="icon-[lucide--shield-off]" />
                    {{ t('Remove authenticator') }}
                </FpButton>
            </div>
        </FpCard>
    </div>
</template>
