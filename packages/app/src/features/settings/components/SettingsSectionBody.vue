<script setup lang="ts">
import { computed } from 'vue'

import type { SectionKey } from '../model'
import { SECTION_BODIES } from '../sections'
import SectionPending from './SectionPending.vue'

const props = defineProps<{ section: SectionKey }>()

const body = computed(() => SECTION_BODIES[props.section] ?? SectionPending)
</script>

<template>
    <component :is="body" />
</template>
