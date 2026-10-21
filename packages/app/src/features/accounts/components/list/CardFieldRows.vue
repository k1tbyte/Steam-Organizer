<script setup lang="ts">
import { FpEyebrow } from '@so/ui'

import { useCardFields } from '../../composables/useCardFields'
import CardFieldRow from './CardFieldRow.vue'

const { groups, isOn, toggle } = useCardFields()
</script>

<template>
    <div class="flex flex-col px-2 pb-2 lg:px-1.5 lg:pb-1.5">
        <template v-for="group in groups" :key="group.title">
            <FpEyebrow class="px-3 pt-3 pb-1 lg:px-2.5 lg:pt-2.5">{{ group.title }}</FpEyebrow>
            <CardFieldRow
                v-for="row in group.rows"
                :key="row.key"
                :row="row"
                :on="isOn(row)"
                @toggle="toggle(row)" />
        </template>
    </div>
</template>
