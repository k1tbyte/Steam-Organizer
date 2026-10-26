<script setup lang="ts">
import { FpIcon, tip } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { AccountTag } from '../../model'
import AccountTagChip from './AccountTagChip.vue'

const props = defineProps<{
    shown: AccountTag[]
    hidden: AccountTag[]
    touch: boolean
}>()
const emit = defineEmits<{ edit: [anchor: HTMLElement] }>()

const { t } = useI18n()
const hiddenNames = computed(() => props.hidden.map((tag) => tag.label).join(', '))
const tagged = computed(() => props.shown.length > 0)
const edit = (event: MouseEvent) => emit('edit', event.currentTarget as HTMLElement)
</script>

<template>
    <div
        class="flex shrink-0 items-center gap-1 overflow-hidden"
        :class="touch ? 'h-7' : 'h-5.5'">
        <AccountTagChip v-for="tag in shown" :key="tag.id" :tag="tag" />
        <span
            v-if="hidden.length > 0"
            v-bind="tip(hiddenNames)"
            class="inline-flex h-5.5 shrink-0 items-center rounded-full bg-surface-hi px-1.75 font-medium font-mono text-11.5 text-fg-2">
            +{{ hidden.length }}
        </span>
        <!-- One node for both looks: the picker hangs from it and keeps its place when the first tag lands. -->
        <button
            v-bind="tagged ? tip(t('Edit tags'), { label: true }) : {}"
            type="button"
            class="shrink-0 cursor-pointer items-center rounded-full text-fg-3 transition-colors duration-fast hover:text-fg-1"
            :class="tagged ? ['grid place-items-center text-13 hover:bg-hover', touch ? 'size-7' : 'size-5.5'] : 'inline-flex h-5.5 gap-1 pr-2.25 pl-1.75 font-medium text-12 ring-1 ring-stroke-2 ring-inset hover:ring-fg-3'"
            @click="edit">
            <FpIcon name="icon-[lucide--plus]" :class="!tagged && 'text-12'" />
            <template v-if="!tagged">{{ t('Add tag') }}</template>
        </button>
    </div>
</template>
