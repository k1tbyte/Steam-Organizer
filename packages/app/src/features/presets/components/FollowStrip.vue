<script setup lang="ts">
import { FpBadge, FpButton, FpDot, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

/** The preset this device follows; once modified, the ways back. */
defineProps<{ name: string; modified: boolean; canUpdate: boolean }>()
const emit = defineEmits<{ update: []; saveNew: []; revert: [event: MouseEvent] }>()

const { t } = useI18n()
</script>

<template>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded bg-surface-hi px-3 py-2.5">
        <div class="flex min-w-0 flex-1 items-center gap-3">
            <span
                class="grid size-7 shrink-0 place-items-center rounded text-15"
                :class="modified ? 'bg-surface-pop text-fg-2 ring-1 ring-stroke-2 ring-inset' : 'bg-accent-soft text-accent-ink'">
                <FpIcon :name="modified ? 'icon-[lucide--unlink-2]' : 'icon-[lucide--link-2]'" />
            </span>
            <div v-if="modified" class="flex min-w-0 flex-1 flex-col gap-0.75">
                <span class="flex flex-wrap items-center gap-2 font-semibold text-13.5 text-fg-1">
                    {{ name }}
                    <FpBadge color="warning" class="text-fg-1!">
                        <FpDot color="warning" />
                        {{ t('Modified') }}
                    </FpBadge>
                </span>
                <span class="text-12.5 text-fg-3 leading-snug">
                    {{ t("This device stopped following it. Edits made elsewhere won't arrive.") }}
                </span>
            </div>
            <div v-else class="flex min-w-0 flex-1 flex-col gap-px">
                <span class="text-13.5 text-fg-1">
                    {{ t('Following') }} <span class="font-semibold">{{ name }}</span>
                </span>
                <span class="text-12.5 text-fg-3">{{ t('Edits to it on other devices apply here.') }}</span>
            </div>
        </div>
        <div v-if="modified" class="flex flex-wrap justify-end gap-1.5 max-lg:grid max-lg:w-full max-lg:grid-cols-2">
            <FpButton
                v-if="canUpdate"
                color="accent"
                variant="solid"
                size="sm"
                class="max-lg:col-span-2"
                :label="t('Update preset')"
                @click="emit('update')" />
            <FpButton variant="outline" size="sm" :label="t('Save as new')" @click="emit('saveNew')" />
            <FpButton variant="ghost" size="sm" :label="t('Revert')" @click="emit('revert', $event)" />
        </div>
    </div>
</template>
