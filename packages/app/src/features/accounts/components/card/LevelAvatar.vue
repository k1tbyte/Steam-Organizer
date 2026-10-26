<script setup lang="ts">
import { FpIcon, tip } from '@so/ui'
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
        /** `lg` and `xl` are the profile's phone and desktop identity; `xs` a row in a list of names. */
        size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    }>(),
    { size: 'md' },
)

// Per size: the box, the avatar's inset and type, and the level badge.
const SIZES = {
    xs: { box: 'size-6', inset: 'inset-0.5', text: 'text-10', badge: '' },
    sm: { box: 'size-9.5', inset: 'inset-0.75', text: 'text-12', badge: '' },
    md: {
        box: 'size-13.5',
        inset: 'inset-1',
        text: 'text-15',
        badge: 'bottom-[-7px] h-4 min-w-4 px-1.25 text-10 ring-2 ring-surface',
    },
    lg: {
        box: 'size-18',
        inset: 'inset-1.25',
        text: 'text-20',
        badge: 'bottom-[-8px] h-4.5 min-w-4.5 px-1.5 text-10 ring-3 ring-canvas',
    },
    xl: {
        box: 'size-22',
        inset: 'inset-1.5',
        text: 'text-26',
        badge: 'bottom-[-9px] h-5 min-w-5 px-1.75 text-12 ring-3 ring-canvas',
    },
} as const

const { t } = useI18n()
const showRing = computed(() => props.ring && !props.anonymous)
const sizing = computed(() => SIZES[props.size])
</script>

<template>
    <span
        class="lvl relative shrink-0"
        :class="sizing.box"
        :data-size="size"
        :data-ring="showRing || undefined"
        :data-anonymous="anonymous || undefined"
        :data-tier="levelTier(level)"
        :style="{ '--hue': hue, '--lvl-hue': levelHue(level) }">
        <span v-if="showRing" class="ring absolute inset-0" />
        <span
            class="avatar absolute grid place-items-center font-semibold text-on-media"
            :class="[showRing ? sizing.inset : 'inset-0', sizing.text]">
            <FpIcon v-if="anonymous" name="icon-[lucide--venetian-mask]" :class="size === 'xs' ? 'text-14' : 'text-20'" />
            <template v-else>{{ initialsOf(name) }}</template>
        </span>
        <span
            v-if="showRing && sizing.badge"
            v-bind="tip(t('Steam level'))"
            class="badge absolute inset-x-0 mx-auto grid w-fit place-items-center rounded-full font-mono font-semibold"
            :class="sizing.badge">
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
.lvl[data-size='xs'] {
    --r-avatar: 0.3;
}
.lvl[data-size='sm'] {
    --ring-w: 1.5px;
    --r-ring: 0.45;
    --r-avatar: 0.45;
    --r-avatar-inset: 0.32;
}
.lvl[data-size='lg'] {
    --ring-w: 2.5px;
    --r-ring: 0.75;
    --r-avatar-inset: 0.5;
}
.lvl[data-size='xl'] {
    --ring-w: 2.5px;
    --r-ring: 0.85;
    --r-avatar-inset: 0.6;
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
