<script setup lang="ts">
import { FpButton, FpEmpty, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ vaultEmpty: boolean }>()
defineEmits<{ add: []; reset: [] }>()

const { t } = useI18n()
</script>

<template>
    <FpEmpty
        class="py-20"
        :title="vaultEmpty ? t('No accounts yet') : t('No accounts match')"
        :description="vaultEmpty ? t('Add your first Steam account to the vault') : undefined">
        <template #leading>
            <FpIcon :name="vaultEmpty ? 'icon-[lucide--users]' : 'icon-[lucide--search-x]'" />
        </template>
        <template #actions>
            <FpButton v-if="vaultEmpty" color="accent" @click="$emit('add')">
                <FpIcon name="icon-[lucide--plus]" />
                {{ t('Add account') }}
            </FpButton>
            <FpButton v-else variant="soft" :label="t('Reset filters')" @click="$emit('reset')" />
        </template>
    </FpEmpty>
</template>
