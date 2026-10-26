<script setup lang="ts">
import { FpIcon, FpPopover, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { SteamIdFieldState } from '../../composables/hero/useSteamIdField'

defineProps<{ field: SteamIdFieldState; touch: boolean }>()

const { t } = useI18n()
</script>

<template>
    <div class="flex items-center rounded bg-surface-hi" :class="touch ? 'h-12' : 'h-9.5'">
        <FpPopover
            sheet
            placement="bottom-start"
            width="min(92vw, 21.25rem)"
            :label="t('Choose ID format')">
            <button
                type="button"
                class="flex h-full shrink-0 cursor-pointer items-center gap-1 pr-2 pl-3 font-medium text-12.5 text-fg-2 transition-colors duration-fast hover:text-fg-1 max-lg:pr-2.5 max-lg:pl-3.5">
                {{ field.label }}
                <FpIcon name="icon-[lucide--chevron-down]" class="text-12" />
            </button>
            <template #content="{ close }">
                <button
                    v-for="option in field.options"
                    :key="option.format"
                    type="button"
                    class="touch-row grid h-8.5 w-full cursor-pointer grid-cols-[1rem_7rem_minmax(0,1fr)] items-center gap-2 rounded pr-2.5 pl-2 text-left transition-colors duration-fast hover:bg-hover"
                    @click="
                        field.select(option.format);
                        close();
                    ">
                    <FpIcon
                        name="icon-[lucide--check]"
                        class="text-13 text-accent-ink"
                        :class="!option.selected && 'opacity-0'" />
                    <span class="text-12.5 text-fg-1">{{ option.label }}</span>
                    <span class="truncate text-right font-mono text-12 text-fg-3">{{ option.value }}</span>
                </button>
            </template>
        </FpPopover>
        <span class="h-4 w-px shrink-0 bg-stroke-2" />
        <span class="min-w-0 flex-1 truncate px-2.5 font-medium font-mono text-13 text-fg-1">{{ field.value }}</span>
        <button
            v-bind="tip(t('Copy'), { disabled: touch })"
            type="button"
            :aria-label="t('Copy')"
            class="grid h-full w-9 shrink-0 cursor-pointer place-items-center text-14 transition-colors duration-fast max-lg:w-11.5"
            :class="field.copied ? 'text-success' : 'text-fg-3 hover:text-fg-1'"
            @click="field.copy">
            <FpIcon :name="field.copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
        </button>
    </div>
</template>
