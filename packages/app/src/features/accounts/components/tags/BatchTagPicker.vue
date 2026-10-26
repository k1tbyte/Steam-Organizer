<script setup lang="ts">
import { FpButton, FpCheckbox, FpPopover } from '@so/ui'
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useBatchTags } from '../../composables/tags/useBatchTags'
import TagSearchPanel from './TagSearchPanel.vue'

const props = defineProps<{
    ids: readonly string[]
    anchor: HTMLElement | undefined
}>()
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const batch = reactive(useBatchTags(() => props.ids))
watch(open, (shown) => {
    if (shown) batch.reset()
})

function apply() {
    batch.apply()
    open.value = false
}
</script>

<template>
    <FpPopover
        v-model:open="open"
        :anchor="anchor"
        sheet
        :padded="false"
        width="min(92vw, 19rem)"
        max-height="28rem"
        placement="bottom-end"
        :label="t('Edit tags')">
        <template #content>
            <TagSearchPanel :search="batch.search" @submit="batch.submit" @create="batch.create">
                <!-- The label passes a press anywhere on the row to the box; the box's own next state is ignored for the tag's cycle. -->
                <label
                    v-for="row in batch.rows"
                    :key="row.id"
                    class="touch-row flex h-8 cursor-pointer items-center gap-2.5 rounded px-2 text-13 text-fg-1 hover:bg-hover">
                    <FpCheckbox :model-value="row.checked" size="sm" @update:model-value="batch.toggle(row.id)" />
                    <span class="tag-dot size-2 rounded-full" :style="{ '--hue': row.hue }" />
                    <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
                    <span class="font-mono text-11.5" :class="row.changed ? 'text-accent-ink' : 'text-fg-3'">
                        {{ row.count }}
                    </span>
                </label>
            </TagSearchPanel>
            <div class="flex items-center gap-1.5 border-t border-stroke-1 py-2 pr-2 pl-3.5">
                <span class="min-w-0 flex-1 truncate text-12 text-fg-3">{{ batch.note }}</span>
                <FpButton size="sm" variant="ghost" :disabled="!batch.changed" @click="batch.reset()">
                    {{ t('Reset') }}
                </FpButton>
                <FpButton size="sm" color="accent" :disabled="!batch.changed" @click="apply">
                    {{ t('Apply') }}
                </FpButton>
            </div>
        </template>
    </FpPopover>
</template>
