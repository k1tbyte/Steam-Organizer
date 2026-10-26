<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { computed } from 'vue'

import type { LinkedService } from '../model'
import { svgMask } from '../services/serviceIcon'

const props = defineProps<{ service: LinkedService }>()
const mask = computed(() => props.service.svg && svgMask(props.service.svg))
</script>

<!-- 1em like FpIcon: an uploaded SVG is a mask painted with the text color, so it follows the theme and nothing in it runs. -->
<template>
    <span v-if="mask" class="service-mask inline-block size-[1em] shrink-0" :style="{ '--mask': mask }" />
    <FpIcon v-else :name="service.icon ?? 'icon-[lucide--globe]'" />
</template>

<style scoped>
.service-mask {
    background: currentColor;
    mask: var(--mask) center / contain no-repeat;
}
</style>
