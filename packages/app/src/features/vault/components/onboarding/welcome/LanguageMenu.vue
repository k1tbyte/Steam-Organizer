<script setup lang="ts">
import { FpButton, FpDropdownMenu } from '@so/ui'

import { useLanguageMenu } from '../../../composables/useLanguageMenu'

const { items, current } = useLanguageMenu()
</script>

<template>
    <FpDropdownMenu :items placement="bottom-end">
        <FpButton variant="ghost" size="sm" class="text-fg-3!">
            {{ current }}
        </FpButton>
    </FpDropdownMenu>
</template>
