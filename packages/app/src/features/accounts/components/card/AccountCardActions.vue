<script setup lang="ts">
import { FpButton, FpIcon, openContextMenuFrom, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

defineProps<{ touch: boolean; profilePath: string }>()
const emit = defineEmits<{ delete: [] }>()

const { t } = useI18n()

function openMenu(event: MouseEvent) {
    openContextMenuFrom(event.currentTarget as HTMLElement)
}
</script>

<!-- Desktop shows both actions; a touch card opens the list's context menu, which holds them all. -->
<template>
    <FpButton
        v-if="touch"
        square
        size="md"
        variant="ghost"
        class="-mr-1.5"
        aria-haspopup="menu"
        aria-expanded="false"
        :aria-label="t('More actions')"
        @click="openMenu">
        <FpIcon name="icon-[lucide--ellipsis-vertical]" />
    </FpButton>
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
