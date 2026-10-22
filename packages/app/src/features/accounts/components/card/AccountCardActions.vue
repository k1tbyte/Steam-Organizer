<script setup lang="ts">
import { type DropdownItem, FpButton, FpDropdownMenu, FpIcon, tip } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRouter } from 'vue-router'

const props = defineProps<{ touch: boolean; profilePath: string }>()
const emit = defineEmits<{ delete: [] }>()

const { t } = useI18n()
const router = useRouter()

const items = computed<DropdownItem[]>(() => [
    {
        label: t('Open profile'),
        icon: 'icon-[lucide--external-link]',
        onSelect: () => void router.push(props.profilePath),
    },
    {
        label: t('Delete'),
        icon: 'icon-[lucide--trash-2]',
        color: 'danger',
        onSelect: () => emit('delete'),
    },
])
</script>

<!-- Desktop shows both actions; a touch card folds them into one menu. -->
<template>
    <FpDropdownMenu v-if="touch" :items="items" placement="bottom-end">
        <FpButton
            square
            size="md"
            variant="ghost"
            class="-mr-1.5"
            :aria-label="t('More: open profile, delete')">
            <FpIcon name="icon-[lucide--ellipsis-vertical]" />
        </FpButton>
    </FpDropdownMenu>
    <div v-else class="flex shrink-0 gap-0.5">
        <FpButton
            v-bind="tip(t('Open profile'), { label: true })"
            :as="RouterLink"
            :to="profilePath"
            square
            size="xs"
            variant="ghost"
            class="text-fg-3!">
            <FpIcon name="icon-[lucide--external-link]" />
        </FpButton>
        <FpButton
            v-bind="tip(t('Delete'), { label: true })"
            square
            size="xs"
            variant="ghost"
            class="text-fg-3! hover:bg-danger-soft! hover:text-danger!"
            @click="emit('delete')">
            <FpIcon name="icon-[lucide--trash-2]" />
        </FpButton>
    </div>
</template>
