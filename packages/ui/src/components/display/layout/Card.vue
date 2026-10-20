<script setup lang="ts">
defineProps<{
    title?: string
    description?: string
    /** No padding or header: rows and their own paddings fill the card edge to edge. */
    flush?: boolean
}>()
</script>

<template>
    <section
        class="surface flex flex-col rounded-lg"
        :class="flush ? 'overflow-hidden *:first:border-t-0' : 'gap-3.5 p-4'">
        <div v-if="title || $slots.actions" class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <h3 v-if="title" class="font-semibold text-14 text-fg-1">{{ title }}</h3>
                    <slot name="badge" />
                </div>
                <p v-if="description" class="text-12.5 text-fg-3">{{ description }}</p>
            </div>
            <slot name="actions" />
        </div>
        <slot />
    </section>
</template>
