<script setup lang="ts">
import { FpIcon, FpPopover } from '@so/ui'
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useTagPicker } from '../../composables/tags/useTagPicker'
import type { Account } from '../../model'
import TagSearchPanel from './TagSearchPanel.vue'

const props = defineProps<{
    account: Account | undefined
    /** What it hangs from; a sheet on phones. */
    anchor: HTMLElement | undefined
}>()
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const picker = reactive(useTagPicker(() => props.account))
watch(open, (shown) => {
    if (shown) picker.search.reset()
})
</script>

<template>
    <FpPopover
        v-model:open="open"
        :anchor="anchor"
        sheet
        :padded="false"
        width="17rem"
        max-height="24rem"
        placement="bottom-start"
        :label="t('Edit tags')">
        <template #content>
            <TagSearchPanel :search="picker.search" @submit="picker.submit" @create="picker.create">
                <button
                    v-for="row in picker.rows"
                    :key="row.id"
                    type="button"
                    :aria-pressed="row.on"
                    class="touch-row flex h-8 cursor-pointer items-center gap-2.5 rounded px-2 text-left text-13 text-fg-1 hover:bg-hover"
                    @click="picker.toggle(row.id)">
                    <span class="tag-dot size-2 rounded-full" :style="{ '--hue': row.hue }" />
                    <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
                    <FpIcon v-if="row.on" name="icon-[lucide--check]" class="text-14 text-accent-ink" />
                </button>
            </TagSearchPanel>
        </template>
    </FpPopover>
</template>
