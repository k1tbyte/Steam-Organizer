<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

import { useAutofill } from '../composables/useAutofill'
import GuardPrompt from './GuardPrompt.vue'
import LoginFieldButton from './LoginFieldButton.vue'
import LoginPicker from './LoginPicker.vue'

const {
    showTrigger,
    showPicker,
    showGuard,
    triggerStyle,
    pickerStyle,
    guardStyle,
    pickerOpen,
    togglePicker,
    closePicker,
    guardAccount,
    guardNotice,
    openGuardNotice,
    filled,
    dismissGuard,
    fillAccount,
    fillCode,
} = useAutofill()

const root = useTemplateRef('root')
// The shadow root is closed: a window listener sees a click on the picker or the trigger as one on the host.
// The trigger toggles itself, so counting it as inside keeps it from closing the picker just to reopen it.
const host = computed(
    () => (root.value?.getRootNode() as ShadowRoot | undefined)?.host as HTMLElement | undefined,
)
onClickOutside(host, closePicker)
</script>

<!-- Fills the viewport without taking its clicks; the controls inside opt back in. -->
<template>
    <div ref="root" class="panel-base pointer-events-none fixed inset-0">
        <LoginFieldButton
            v-if="showTrigger"
            :style="triggerStyle"
            :open="pickerOpen"
            @toggle="togglePicker" />
        <LoginPicker
            v-if="showPicker"
            :style="pickerStyle"
            @fill="fillAccount"
            @close="closePicker" />
        <GuardPrompt
            v-if="showGuard"
            :style="guardStyle"
            :account="guardAccount"
            :filled
            :notice="guardNotice"
            @fill="fillCode"
            @unlock="openGuardNotice"
            @dismiss="dismissGuard" />
    </div>
</template>
