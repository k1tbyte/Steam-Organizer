<script setup lang="ts">
import { tip } from '@so/ui'
import { useI18n } from 'vue-i18n'
import { useBanLabels } from '../../composables/useBanLabels'
import { BAN_KINDS, type BanKind } from '../../model'

defineProps<{ bans: BanKind[] }>()

const { t } = useI18n()
const labels = useBanLabels()
</script>

<template>
    <ul class="grid shrink-0 grid-cols-[repeat(4,1rem)] gap-0.5" :aria-label="t('Bans')">
        <li
            v-for="kind in BAN_KINDS"
            :key="kind"
            v-bind="tip(
                bans.includes(kind)
                    ? t('{ban} ban', { ban: labels[kind] })
                    : t('{ban}: clean', { ban: labels[kind] })
            )"
            class="letter grid h-4 cursor-default place-items-center font-mono font-semibold text-10"
            :class="bans.includes(kind) ? 'bg-danger-soft text-danger' : 'bg-surface-hi text-fg-faint'">
            {{ kind.charAt(0).toUpperCase() }}
        </li>
    </ul>
</template>

<style scoped>
.letter {
    border-radius: calc(var(--radius-base) * 0.22);
}
</style>
