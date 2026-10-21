<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
import { useI18n } from 'vue-i18n'

import { useOnboardingFrame } from '../../composables/useOnboardingFrame'

defineProps<{
    title: string
    description?: string
    /** Where Back goes when the page was opened by link. */
    back?: string
    /** Phones only: the logo above the heading, where desktop has the header. */
    brand?: boolean
}>()

const { t } = useI18n()
const { desktop, stepCounter, goBack } = useOnboardingFrame()
</script>

<!-- `cta` is the primary action: pinned above the home bar on phones. `footer` ends the page. -->
<template>
    <div
        :class="
            desktop
                ? 'flex w-110 max-w-full flex-col gap-5'
                : 'flex min-h-0 flex-1 flex-col'
        ">
        <FpButton
            v-if="back && desktop"
            variant="ghost"
            size="sm"
            class="-ml-1 self-start"
            @click="goBack(back)">
            <FpIcon name="icon-[lucide--arrow-left]" aria-hidden="true" />
            {{ t('Back') }}
        </FpButton>
        <div
            v-else-if="!desktop && (back || stepCounter)"
            class="flex h-11 shrink-0 items-center pr-5 pl-1">
            <FpButton
                v-if="back"
                variant="ghost"
                color="accent"
                size="xl"
                class="pl-1"
                @click="goBack(back)">
                <FpIcon name="icon-[lucide--chevron-left]" class="text-22" aria-hidden="true" />
                {{ t('Back') }}
            </FpButton>
            <span class="flex-1" />
            <span v-if="stepCounter" class="font-medium font-mono text-11.5 text-fg-3">
                {{ stepCounter }}
            </span>
        </div>

        <div
            :class="
                desktop
                    ? 'contents'
                    : [
                          'flex min-h-0 flex-1 flex-col overflow-y-auto px-5',
                          brand ? 'gap-5.5 pt-6 pb-7' : 'gap-4.5 pt-3 pb-4',
                      ]
            ">
            <img v-if="brand && !desktop" :src="logoUrl" alt="" class="size-10" />
            <div class="flex flex-col gap-2">
                <h2 class="font-title text-26 text-fg-1 leading-[1.15]">{{ title }}</h2>
                <p v-if="description" class="text-14.5 text-fg-3 text-pretty leading-[1.55]">
                    {{ description }}
                </p>
            </div>
            <slot />
            <div v-if="$slots.footer" :class="!desktop && 'mt-auto'">
                <slot name="footer" />
            </div>
        </div>

        <div v-if="$slots.cta" :class="!desktop && 'safe-pb shrink-0 px-5 py-2'">
            <slot name="cta" />
        </div>
    </div>
</template>
