<script setup lang="ts">
import { FpButton, FpIcon, tip } from '@so/ui'

import { useAccountsFilters } from '../../composables/useAccountsFilters'

const { chips, cycleBan } = useAccountsFilters()
</script>

<template>
    <FpButton
        v-for="chip in chips"
        :key="chip.kind"
        v-bind="tip(chip.title)"
        round
        size="xs"
        :variant="chip.variant"
        :color="chip.color"
        class="shrink-0"
        @click="cycleBan(chip.kind)">
        <FpIcon :name="chip.icon" />
        {{ chip.label }}
    </FpButton>
</template>
