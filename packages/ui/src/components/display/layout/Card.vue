<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
    <section class="surface flex flex-col gap-4 rounded p-5">
        <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <h3 class="font-medium text-fg-1">{{ title }}</h3>
                    <slot name="badge" />
                </div>
                <p v-if="description" class="text-fg-3 text-sm">{{ description }}</p>
            </div>
            <slot name="actions" />
        </div>
        <slot />
    </section>
</template>
