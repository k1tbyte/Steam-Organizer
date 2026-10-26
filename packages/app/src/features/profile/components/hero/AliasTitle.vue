<script setup lang="ts">
import { FpButton, FpIcon, FpInput, FpKbd, tip } from '@so/ui'
import { useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import type { AliasEditorState } from '../../composables/hero/useAliasEditor'

const props = defineProps<{ account: Account; editor: AliasEditorState; touch: boolean }>()

const { t } = useI18n()
const input = useTemplateRef('input')
watch(
    () => props.editor.editing,
    (editing) => {
        if (editing) input.value?.focus()
    },
    { flush: 'post' },
)

// Enter that picks an IME candidate belongs to the composition; Safari reports that one as key 229.
function onEnter(event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) return
    event.preventDefault()
    props.editor.save()
}
</script>

<!-- The name, its rename field, and the Steam nickname under an alias. The slot follows the name in its row. -->
<template>
    <div v-if="editor.editing" class="flex min-w-0 flex-col gap-1.5">
        <div class="-ml-2.75 max-w-96">
            <FpInput
                ref="input"
                v-model="editor.draft"
                :size="touch ? 'lg' : 'md'"
                class="font-title tracking-title"
                :class="touch ? 'text-20' : 'text-26'"
                :placeholder="account.steamNickname ?? ''"
                :aria-label="t('Alias')"
                @keydown.enter="onEnter"
                @keydown.esc.prevent.stop="editor.cancel"
                @blur="editor.save" />
        </div>
        <span v-if="!touch" class="flex items-center gap-1.5 text-12 text-fg-3">
            <FpKbd value="↵" />{{ t('save') }}
            <FpKbd value="Esc" class="ml-1" />{{ t('cancel') }}
            <span v-if="editor.clears" class="ml-1">{{ t('Empty shows the Steam name') }}</span>
        </span>
    </div>
    <div v-else class="flex min-w-0 flex-col gap-1">
        <div class="flex min-w-0 items-center gap-1.5">
            <component
                :is="touch ? 'h1' : 'h2'"
                class="min-w-0 truncate font-title text-fg-1 tracking-title"
                :class="touch ? 'text-20' : 'text-26'">
                {{ account.nickname }}
            </component>
            <FpButton
                v-if="editor.allowed"
                v-bind="tip(t('Rename (F2)'), { label: true })"
                square
                size="xs"
                variant="ghost"
                class="text-fg-3!"
                @click="editor.start">
                <FpIcon name="icon-[lucide--pencil]" />
            </FpButton>
            <div v-if="$slots.default" class="ml-1 flex items-center gap-2.5">
                <slot />
            </div>
        </div>
        <span v-if="editor.steamName" class="flex min-w-0 items-center gap-1.5 text-14 text-fg-3">
            <span class="truncate">{{ editor.steamName }}</span>
            <span class="shrink-0 font-mono text-12">· {{ t('Steam name') }}</span>
        </span>
        <FpButton
            v-else-if="editor.offersAlias"
            size="xs"
            variant="ghost"
            color="accent"
            class="-ml-2 self-start"
            @click="editor.start">
            <FpIcon name="icon-[lucide--plus]" />
            {{ t('Add alias') }}
        </FpButton>
    </div>
</template>
