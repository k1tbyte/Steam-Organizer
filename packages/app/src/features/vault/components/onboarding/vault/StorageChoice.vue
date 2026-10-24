<script setup lang="ts">
import { FpBadge, FpChoice, FpIcon, FpIconTile } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { StorageOption } from '../../../composables/useVaultStep'

defineProps<{ option: StorageOption }>()
const { t } = useI18n()
</script>

<template>
    <FpChoice
        :value="option.value"
        :disabled="option.unavailable !== undefined"
        class="group block w-full bg-surface backdrop-surface">
        <span class="flex min-h-15 items-center gap-3 py-2.5 pr-3.5 pl-2.5">
            <FpIconTile
                :name="option.icon"
                class="group-data-[state=checked]:bg-accent-soft group-data-[state=checked]:text-accent-ink" />
            <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="flex items-center gap-2 font-semibold text-14 text-fg-1">
                    {{ option.title }}
                    <FpBadge
                        v-if="option.recommended"
                        color="accent"
                        class="max-lg:hidden"
                        :label="t('Recommended')" />
                </span>
                <span class="text-12.5 text-fg-3 leading-[1.4]">{{ option.description }}</span>
                <span
                    v-if="option.unavailable"
                    class="mt-0.5 flex items-center gap-1.5 font-medium text-12.5 text-fg-2">
                    <FpIcon name="icon-[lucide--circle-alert]" class="text-13" aria-hidden="true" />
                    {{ option.unavailable }}
                </span>
            </span>
            <span
                class="grid size-4.5 shrink-0 place-items-center rounded-full ring-[1.5px] ring-stroke-2 ring-inset group-data-[state=checked]:ring-accent">
                <span class="size-2 rounded-full group-data-[state=checked]:bg-accent" />
            </span>
        </span>
    </FpChoice>
</template>
