<script setup lang="ts">
import { PinInputInput, PinInputRoot } from 'reka-ui'
import { ref, watch } from 'vue'
import { useFormField } from '../FormField/form-field'

withDefaults(
    defineProps<{
        length?: number
        /** Shows dots instead of digits, for a PIN typed in public. */
        masked?: boolean
        disabled?: boolean
    }>(),
    { length: 6 },
)

const emit = defineEmits<{ complete: [value: string] }>()

const model = defineModel<string>({ default: '' })

// Stable array identity prevents reka's deep watcher from emitting `complete` twice.
const characters = ref<string[]>(model.value.split(''))

watch(characters, (value) => {
    model.value = value.join('')
}, { deep: true })

watch(model, (value) => {
    if (characters.value.join('') !== value) characters.value = value.split('')
})

const field = useFormField()
</script>

<template>
    <PinInputRoot
        v-model="characters"
        otp
        :mask="masked"
        :disabled
        class="contents"
        @complete="(value) => emit('complete', value.join(''))">
        <fieldset
            :disabled
            :aria-labelledby="field?.labelledBy?.value"
            :aria-describedby="field?.describedBy?.value"
            class="m-0 flex min-w-0 justify-center gap-2 border-0 p-0"
            :class="disabled && 'pointer-events-none opacity-50'">
            <PinInputInput
                v-for="(_, index) in length"
                :key="index"
                :id="index === 0 ? field?.id : undefined"
                :index
                inputmode="numeric"
                :aria-invalid="field?.invalid.value || undefined"
                class="field size-11 min-w-0 rounded text-center font-semibold text-fg-1 text-17 caret-accent outline-none" />
        </fieldset>
    </PinInputRoot>
</template>

<style scoped>
/* Nested boxes need their own invalid ring. */
[aria-invalid='true'],
[aria-invalid='true']:hover {
    box-shadow: inset 0 0 0 1px var(--danger);
}
[aria-invalid='true']:focus-within {
    box-shadow:
        inset 0 0 0 1px var(--danger),
        0 0 0 3px color-mix(in oklch, var(--danger) 25%, transparent);
}
</style>
