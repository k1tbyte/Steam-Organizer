<script setup lang="ts">
import { useBump } from '../../composables/useBump'

const props = defineProps<{ trigger: unknown }>()
const { bumping, settle } = useBump(() => props.trigger)
</script>

<!-- A wrong password or PIN: shakes once per change of `trigger`, never on mount. -->
<template>
    <div :class="bumping && 'motion-on:animate-shake'" @animationend.self="settle">
        <slot />
    </div>
</template>
