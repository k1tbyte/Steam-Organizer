<script setup lang="ts">
import { FpButton, FpDropdownMenu, FpIcon, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useTransferMenu } from '../../composables/transfer/useTransferMenu'
import ExportVaultDialog from './ExportVaultDialog.vue'
import ImportVaultDialog from './ImportVaultDialog.vue'

const { t } = useI18n()
const view = useTransferMenu()
</script>

<template>
    <FpDropdownMenu :items="view.menu.value" placement="bottom-end">
        <FpButton
            v-bind="tip(t('Import / export'), { label: true })"
            square
            size="sm"
            variant="ghost"
            class="text-fg-3!">
            <FpIcon name="icon-[lucide--ellipsis]" />
        </FpButton>
    </FpDropdownMenu>
    <ExportVaultDialog v-model:open="view.exportOpen.value" />
    <ImportVaultDialog :importing="view.importing" />
</template>
