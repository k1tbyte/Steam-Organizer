<script setup lang="ts">
import {
    AccordionContent,
    AccordionHeader,
    AccordionItem as AccordionItemRoot,
    AccordionRoot,
    AccordionTrigger,
} from 'reka-ui'

export interface AccordionItem {
    label: string
    content?: string
    value?: string
    disabled?: boolean
}

withDefaults(
    defineProps<{
        items: AccordionItem[]
        multiple?: boolean
        disabled?: boolean
        /** Off snaps the height, for a measured parent (`FpModal`) or tall content. */
        morph?: boolean
    }>(),
    { morph: true },
)

const model = defineModel<string | string[]>()
</script>

<template>
    <AccordionRoot
        v-model="model"
        :type="multiple ? 'multiple' : 'single'"
        collapsible
        :disabled="disabled"
        class="w-full divide-y divide-stroke-2">
        <AccordionItemRoot
            v-for="(item, index) in items"
            :key="item.value ?? String(index)"
            :value="item.value ?? String(index)"
            :disabled="item.disabled">
            <AccordionHeader>
                <AccordionTrigger
                    class="trigger flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-start font-medium text-fg-1 text-13 outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    <slot name="trigger" :item="item" :index="index">{{ item.label }}</slot>
                    <svg
                        class="chevron shrink-0 text-fg-3"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent class="body overflow-hidden" :class="morph && 'slide'">
                <div class="settle pb-3 text-fg-3 text-13">
                    <slot name="content" :item="item" :index="index">{{ item.content }}</slot>
                </div>
            </AccordionContent>
        </AccordionItemRoot>
    </AccordionRoot>
</template>

<style scoped>
.chevron {
    transition: rotate var(--dur-base) var(--ease-out);
}
.trigger[data-state='open'] .chevron {
    rotate: 180deg;
}
.slide[data-state='open'] {
    animation: slide-down var(--dur-base) var(--ease-out);
}
.body[data-state='open'] .settle {
    animation: var(--animate-settle);
}
.slide[data-state='closed'] {
    animation: slide-up var(--dur-fast) var(--ease-out);
}
@keyframes slide-down {
    from {
        height: 0;
    }
    to {
        height: var(--reka-accordion-content-height);
    }
}
@keyframes slide-up {
    from {
        height: var(--reka-accordion-content-height);
    }
    to {
        height: 0;
    }
}
</style>
