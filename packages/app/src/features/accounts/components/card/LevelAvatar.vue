<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { initialsOf, levelHue, levelTier } from '../../services/tiers'

const props = withDefaults(
    defineProps<{
        name: string
        hue: number
        level: number
        anonymous?: boolean
        /** The level-colored ring and number badge around the avatar. */
        ring?: boolean
        size?: 'sm' | 'md'
    }>(),
    { size: 'md' },
)

const { t } = useI18n()
const showRing = computed(() => props.ring && !props.anonymous)
</script>

<template>
    <span
        class="lvl relative shrink-0"
        :class="size === 'sm' ? 'size-9.5' : 'size-13.5'"
        :data-size="size"
        :data-ring="showRing || undefined"
        :data-anonymous="anonymous || undefined"
        :data-tier="levelTier(level)"
        :style="{ '--hue': hue, '--lvl-hue': levelHue(level) }">
        <span v-if="showRing" class="ring absolute inset-0" />
        <span
            class="avatar absolute grid place-items-center font-semibold text-on-media"
            :class="[
                showRing ? (size === 'sm' ? 'inset-0.75' : 'inset-1') : 'inset-0',
                size === 'sm' ? 'text-12' : 'text-15',
            ]">
            <FpIcon v-if="anonymous" name="icon-[lucide--venetian-mask]" class="text-20" />
            <template v-else>{{ initialsOf(name) }}</template>
        </span>
        <span
            v-if="showRing && size === 'md'"
            :title="t('Steam level')"
            class="badge absolute bottom-[-7px] left-1/2 grid h-4 min-w-4 -translate-x-1/2 place-items-center rounded-full px-1.25 font-mono font-semibold text-10 ring-2 ring-surface">
            {{ level }}
        </span>
    </span>
</template>

<style scoped>
/* Colors come from custom properties so one rule serves dark and light. */
.lvl {
    --lvl-l: 0.72;
    --av-l: 0.5;
    --av-anon-l: 0.3;
    --lvl: oklch(var(--lvl-l) 0.15 var(--lvl-hue));
    --ring-w: 2px;
    --r-ring: 0.6;
    --r-avatar: 0.6;
    --r-avatar-inset: 0.42;
}
:global([data-mode='light']) .lvl {
    --lvl-l: 0.62;
    --av-l: 0.63;
    --av-anon-l: 0.72;
}
.lvl[data-size='sm'] {
    --ring-w: 1.5px;
    --r-ring: 0.45;
    --r-avatar: 0.45;
    --r-avatar-inset: 0.32;
}
/* Level 0-9 is plain gray; the 80s are a dark red with white digits. */
.lvl[data-tier='0'] {
    --lvl: oklch(var(--lvl-l) 0 0);
}
.lvl[data-tier='8'] {
    --lvl: oklch(from var(--danger) 0.48 0.1 h);
}
.ring {
    border-radius: calc(var(--radius-base) * var(--r-ring));
    box-shadow: inset 0 0 0 var(--ring-w) var(--lvl);
}
.avatar {
    background: oklch(var(--av-l) 0.11 var(--hue));
    border-radius: calc(var(--radius-base) * var(--r-avatar));
}
.lvl[data-ring] .avatar {
    border-radius: calc(var(--radius-base) * var(--r-avatar-inset));
}
.lvl[data-anonymous] .avatar {
    background: oklch(var(--av-anon-l) 0 0);
}
.badge {
    background: var(--lvl);
    color: oklch(from var(--lvl) clamp(0, calc((0.6 - l) * 1000), 1) 0 h);
}
</style>
