<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import FpIcon from '../../display/media/Icon.vue'
import { useFormField } from '../FormField/form-field'
import { FIELD_SIZES, type FieldSize } from '../field'

// Forward native-control attrs past the label wrapper.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        type?: string
        placeholder?: string
        size?: FieldSize
        /** No field chrome: for inputs that sit inside another surface (a search pill). */
        bare?: boolean
        disabled?: boolean
        /** Advisory ring (a missing translation): never sets aria-invalid. */
        warning?: boolean
        autocomplete?: string
    }>(),
    { type: 'text', size: 'md', autocomplete: 'off' },
)

const revealed = ref(false)
const inputType = computed(() =>
    props.type === 'password' && revealed.value ? 'text' : props.type,
)

// Chromium resets selection after microtasks when type changes; rAF restores it later.
function toggleReveal() {
    const el = input.value
    if (el === null) return
    const { selectionStart, selectionEnd } = el
    revealed.value = !revealed.value
    requestAnimationFrame(() => el.setSelectionRange(selectionStart, selectionEnd))
}

const [model, modifiers] = defineModel<string | number>({
    default: '',
    set(value) {
        if (typeof value !== 'string') return value
        if (modifiers.trim) value = value.trim()
        if (modifiers.number) {
            const n = Number.parseFloat(value)
            return Number.isNaN(n) ? value : n
        }
        return value
    },
})

const field = useFormField()

const input = useTemplateRef('input')
defineExpose({
    focus: () => input.value?.focus(),
    blur: () => input.value?.blur(),
})
</script>

<template>
    <!-- biome-ignore lint/a11y/noLabelWithoutControl: the label wraps the native input right below -->
    <label
        class="inline-flex w-full cursor-text items-center gap-2 text-fg-1"
        :class="[!bare && ['field rounded', FIELD_SIZES[size]], disabled && 'pointer-events-none opacity-50']"
        :data-warning="warning || undefined">
        <span v-if="$slots.leading" class="flex shrink-0 items-center text-15 text-fg-3">
            <slot name="leading" />
        </span>
        <input
            ref="input"
            :id="field?.id"
            v-model="model"
            v-bind="$attrs"
            :type="inputType"
            :placeholder
            :disabled
            :autocomplete
            :aria-invalid="field?.invalid.value || undefined"
            :aria-describedby="field?.describedBy?.value"
            class="w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3" />
        <span v-if="$slots.trailing" class="flex shrink-0 items-center text-15 text-fg-3">
            <slot name="trailing" />
        </span>
        <button
            v-if="type === 'password'"
            type="button"
            class="flex shrink-0 cursor-pointer items-center text-15 text-fg-3 transition-colors duration-fast hover:text-fg-1"
            :disabled
            :aria-label="revealed ? 'Hide password' : 'Show password'"
            :aria-pressed="revealed"
            @mousedown="$event.preventDefault()"
            @click="toggleReveal()">
            <FpIcon :name="revealed ? 'icon-[lucide--eye-off]' : 'icon-[lucide--eye]'" />
        </button>
    </label>
</template>
