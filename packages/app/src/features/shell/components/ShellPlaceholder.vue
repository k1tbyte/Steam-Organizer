<script setup lang="ts">
import { FpEmpty, FpIcon } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import PageTopbar from '#components/PageTopbar.vue'
import { SyncStatus } from '#features/backups'

const props = defineProps<{ screen: 'accounts' | 'backups' }>()
const { t } = useI18n()

const title = computed(() =>
    props.screen === 'accounts' ? t('Accounts') : t('Backups'),
)
</script>

<!-- Stands in until the screen's own feature registers its route under the shell. -->
<template>
    <PageTopbar :title="title">
        <template #status><SyncStatus /></template>
    </PageTopbar>
    <FpEmpty :title="title" :description="t('This screen is built by its own feature.')">
        <template #leading><FpIcon name="icon-[lucide--hammer]" /></template>
    </FpEmpty>
</template>
