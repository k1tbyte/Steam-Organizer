<script setup lang="ts">
import { FpToaster } from '@so/ui'
import { TooltipProvider } from 'reka-ui'

import MockPanel from '#components/MockPanel.vue'
</script>

<template>
    <TooltipProvider :delay-duration="300">
        <FpToaster>
            <RouterView />
            <MockPanel />
        </FpToaster>
    </TooltipProvider>
</template>
