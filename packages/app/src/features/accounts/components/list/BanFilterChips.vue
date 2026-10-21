<script setup lang="ts">
import { FpButton, FpIcon } from '@so/ui'

import { useAccountsFilters } from '../../composables/useAccountsFilters'

const { chips, cycleBan } = useAccountsFilters()
</script>

<template>
    <FpButton
        v-for="chip in chips"
        :key="chip.kind"
        round
        size="xs"
        :variant="chip.variant"
        :color="chip.color"
        :title="chip.title"
        class="shrink-0"
        @click="cycleBan(chip.kind)">
        <FpIcon :name="chip.icon" />
        {{ chip.label }}
    </FpButton>
</template>
