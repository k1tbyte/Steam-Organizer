<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from 'vue'
import { useDesktopLayout } from '../../../composables/useDesktopLayout'
import { useFormField } from '../FormField/form-field'
import { type FieldSize, TEXTAREA_SIZES } from '../field'

// Forward native-control attrs past the label wrapper.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        placeholder?: string
        size?: FieldSize
        disabled?: boolean
        /** Advisory ring (a missing translation): never sets aria-invalid. */
        warning?: boolean
        rows?: number
        autoresize?: boolean
        maxRows?: number
    }>(),
    { size: 'md', rows: 3, maxRows: 0 },
)

const [model, modifiers] = defineModel<string>({
    default: '',
    set: (value) => (modifiers.trim ? value.trim() : value),
})

const field = useFormField()

const textarea = useTemplateRef('textarea')
defineExpose({ focus: () => textarea.value?.focus() })

function resize() {
    const el = textarea.value
    if (!el || !props.autoresize) return
    el.style.height = 'auto'
    const line = Number.parseFloat(getComputedStyle(el).lineHeight)
    const max = props.maxRows > 0 ? props.maxRows * line : Number.POSITIVE_INFINITY
    el.style.height = `${Math.min(Math.max(el.scrollHeight, props.rows * line), max)}px`
}
onMounted(resize)
watch(model, async () => {
    await nextTick()
    resize()
})
// The type scale changes at `lg`, and with it the line height.
watch(useDesktopLayout(), resize)
</script>

<template>
    <!-- biome-ignore lint/a11y/noLabelWithoutControl: the label wraps the native textarea right below -->
    <label
        class="field flex w-full cursor-text rounded text-fg-1"
        :class="[TEXTAREA_SIZES[size], disabled && 'pointer-events-none opacity-50']"
        :data-warning="warning || undefined">
        <textarea
            ref="textarea"
            :id="field?.id"
            v-model="model"
            v-bind="$attrs"
            :placeholder
            :disabled
            :rows
            :aria-invalid="field?.invalid.value || undefined"
            :aria-describedby="field?.describedBy?.value"
            class="w-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3"
            :class="autoresize ? 'resize-none' : 'resize-y'" />
    </label>
</template>
