<script setup lang="ts">
import { FpChip, FpIcon } from '@so/ui'
import { toRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useReorderGrid } from '../../composables/reorder/useReorderGrid'
import type { Account } from '../../model'
import AccountCard from '../card/AccountCard.vue'
import AccountsGroupHeading from '../list/AccountsGroupHeading.vue'

/** The groups in the vault order, as the search and filters leave them. */
const props = defineProps<{ pinned: Account[]; rest: Account[] }>()

const { t } = useI18n()
const list = useTemplateRef('list')
const grid = useReorderGrid(
    { pinned: toRef(props, 'pinned'), rest: toRef(props, 'rest') },
    list,
)
</script>

<!-- Cards key by slot at their place's offset: one that stays on screen keeps its node and slides when the order moves,
     one that comes in takes the node of one that left.
     A cover over each card takes its presses, a grip sits where its pin was: a mouse drags a card from anywhere, touch from the grip,
     keys move the focused card. No text selection: Safari starts one despite the prevented press. -->
<template>
    <div class="px-u-6 pb-u-6 select-none max-lg:px-4 max-lg:pb-4">
        <div ref="list" class="relative" :style="{ height: `${grid.totalSize.value}px` }">
            <AccountsGroupHeading
                v-for="heading in grid.headings.value"
                :key="heading.group"
                :group="heading.group"
                class="absolute inset-x-0 top-0 box-content"
                :class="heading.spaced && 'pt-u-2'"
                :style="{ translate: `0 ${heading.y}px` }" />
            <!-- biome-ignore lint/a11y/useSemanticElements: a <button> may not hold the card's links -->
            <div
                v-for="cell in grid.cells.value"
                :key="cell.slot"
                :data-id="cell.account.id"
                role="button"
                tabindex="0"
                :aria-label="t('Move {name}', { name: cell.account.nickname })"
                :aria-pressed="cell.picked"
                class="cell absolute top-0 left-0"
                :class="[cell.state, cell.entered && 'entered', cell.picked && 'picked']"
                :style="{ width: grid.cardWidth.value, translate: `${cell.x}px ${cell.y}px` }"
                @pointerdown="grid.press($event, cell, false)"
                @click="grid.pick($event, cell.account)"
                @keydown.space.prevent="grid.pick($event, cell.account)"
                @keydown="grid.nudge($event, cell.account.id)"
                @focusin="grid.focusIn"
                @focusout="grid.focusOut">
                <AccountCard
                    :inert="grid.keyboard.value"
                    hide-pin
                    :account="cell.account"
                    :flags="grid.flags.value"
                    :touch="grid.touch.value"
                    :class="cell.state === 'lifted' && 'surface-opaque shadow-2'" />
                <span
                    aria-hidden="true"
                    class="absolute z-10 flex touch-none items-center justify-center text-fg-3"
                    :class="grid.touch.value ? 'size-8.5 text-13' : 'size-7 text-12.5'"
                    :style="{ top: grid.cornerInset.value, right: grid.cornerInset.value }"
                    @pointerdown="grid.press($event, cell, true)">
                    <FpIcon name="icon-[lucide--grip-vertical]" />
                </span>
                <template v-if="cell.stack">
                    <span
                        v-for="layer in cell.stack.plates"
                        :key="layer"
                        aria-hidden="true"
                        class="plate surface surface-opaque"
                        :class="`plate-${layer}`" />
                    <FpChip
                        standalone
                        size="lg"
                        :text="cell.stack.count"
                        class="absolute -top-2 -left-2 z-20 animate-pop" />
                </template>
            </div>
        </div>
        <span class="sr-only" aria-live="polite">{{ grid.announcement.value }}</span>
    </div>
</template>

<style scoped>
.cell {
    cursor: grab;
    transition: translate var(--dur-base) var(--ease-out);
}

/* A node handed to another account jumps to its place, landing or not. */
.cell.entered {
    transition: none;
}

/* Takes the card's presses: `inert` or `pointer-events: none` on the cards cost Chrome a compositor layer per card part. */
.cell::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: var(--radius-lg);
    transition:
        background-color var(--dur-fast) var(--ease-out),
        box-shadow var(--dur-fast) var(--ease-out);
}
.picked::after {
    background-color: color-mix(in oklch, var(--accent) 10%, transparent);
    box-shadow: inset 0 0 0 2px var(--accent);
}

/* The ring follows the card's radius, not the cell's square box. */
.cell:focus-visible {
    outline: none;
}
.cell:focus-visible > :first-child {
    outline: 2px solid var(--accent-ring);
    outline-offset: 2px;
}

/* Cells sit at `translate`: `scale` wraps a `transform`, so it would scale the offset too. */
.lifted {
    z-index: 2;
    cursor: grabbing;
    scale: 1.03;
    transition: scale var(--dur-fast) var(--ease-out);
}

/* Picked cards on screen fly into the lifted stack and fade under it; landing, they fan out of it. */
.gathering {
    z-index: 1;
    opacity: 0;
    transition:
        translate var(--dur-base) var(--ease-out),
        opacity var(--dur-base) var(--ease-in);
}

.landing {
    z-index: 1;
    transition:
        translate var(--dur-slow) var(--ease-spring),
        scale var(--dur-slow) var(--ease-out),
        opacity var(--dur-base) var(--ease-out);
}

/* The stack's cards behind the lifted one: they peek out from under it, so several read as one. */
.plate {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: var(--radius-lg);
    transition:
        translate var(--dur-base) var(--ease-spring),
        rotate var(--dur-base) var(--ease-spring);
}
.plate-1 {
    translate: 6px 5px;
    rotate: 2deg;
}
.plate-2 {
    translate: -5px 9px;
    rotate: -2.5deg;
}
@starting-style {
    .plate {
        translate: 0 0;
        rotate: 0deg;
    }
}
</style>
