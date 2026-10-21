<script setup lang="ts">
import { FpIcon, FpTooltip } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ageTier } from '../../services/tiers'

const props = defineProps<{ years: number; since: string }>()

const { t } = useI18n()
const tier = computed(() => ageTier(props.years, false))
const tierName = computed(
    () =>
        [t('Under 5 years'), t('5+ years'), t('10+ years'), t('15+ years')][
            tier.value
        ],
)
</script>

<template>
    <FpTooltip
        :text="
            t('{years} years on Steam · since {since} · {tier}', {
                years,
                since,
                tier: tierName,
            })
        ">
        <span
            class="age inline-flex h-4.5 shrink-0 items-center gap-1 px-1.5 font-mono font-semibold text-11.5"
            :data-tier="tier">
            <FpIcon name="icon-[lucide--hourglass]" class="text-11" />
            {{ t('{years}y', { years }) }}
        </span>
    </FpTooltip>
</template>

<style scoped>
/* The chip reads as the tier's tint; tier 0 is a quiet gray. */
.age {
    --age-l: 0.72;
    --age-c: 0.12;
    --age-h: 50;
    --age: oklch(var(--age-l) var(--age-c) var(--age-h));
    border-radius: calc(var(--radius-base) * 0.3);
    background: color-mix(in oklch, var(--age) 18%, transparent);
    color: var(--age);
}
:global([data-mode='light']) .age {
    --age-l: 0.55;
    --age-c: 0.13;
}
.age[data-tier='0'] {
    background: var(--surf-bg-hi);
    color: var(--text-3);
}
.age[data-tier='2'] {
    --age-l: 0.8;
    --age-c: 0.08;
    --age-h: 230;
}
:global([data-mode='light']) .age[data-tier='2'] {
    --age-l: 0.52;
    --age-c: 0.1;
    --age-h: 235;
}
.age[data-tier='3'] {
    --age-l: 0.85;
    --age-c: 0.16;
    --age-h: 90;
}
:global([data-mode='light']) .age[data-tier='3'] {
    --age-l: 0.62;
    --age-c: 0.16;
    --age-h: 80;
}
</style>
