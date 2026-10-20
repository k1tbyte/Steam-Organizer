<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ to?: string; disabled?: boolean }>()
</script>

<template>
    <RouterLink v-if="to && !disabled" :to="to"><slot /></RouterLink>
    <button v-else type="button" :disabled="disabled"><slot /></button>
</template>
