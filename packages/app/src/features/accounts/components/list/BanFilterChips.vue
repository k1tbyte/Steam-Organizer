<script setup lang="ts">
import { FpButton, FpIcon, FpTooltip } from '@so/ui'

import { useAccountsFilters } from '../../composables/useAccountsFilters'

const { chips, cycleBan } = useAccountsFilters()
</script>

<template>
    <FpTooltip v-for="chip in chips" :key="chip.kind" :text="chip.title">
        <FpButton
            round
            size="xs"
            :variant="chip.variant"
            :color="chip.color"
            class="shrink-0"
            @click="cycleBan(chip.kind)">
            <FpIcon :name="chip.icon" />
            {{ chip.label }}
        </FpButton>
    </FpTooltip>
</template>
