<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useReorderGrid } from '../../composables/reorder/useReorderGrid'
import AccountCard from '../card/AccountCard.vue'
import AccountsGroupHeading from '../list/AccountsGroupHeading.vue'

const { t } = useI18n()
const list = useTemplateRef('list')
const grid = useReorderGrid(list)
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
                class="absolute inset-x-0 top-0"
                :class="heading.spaced && 'mt-u-2'"
                :style="{ translate: `0 ${heading.y}px` }" />
            <!-- biome-ignore lint/a11y/useSemanticElements: a <button> may not hold the card's links -->
            <div
                v-for="cell in grid.cells.value"
                :key="cell.slot"
                :data-id="cell.account.id"
                role="button"
                tabindex="0"
                :aria-label="t('Move {name}', { name: cell.account.nickname })"
                class="cell absolute top-0 left-0"
                :class="[cell.state, cell.entered && 'entered']"
                :style="{ width: grid.cardWidth.value, translate: `${cell.x}px ${cell.y}px` }"
                @pointerdown="grid.press($event, cell, false)"
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

.landing {
    z-index: 1;
    transition:
        translate var(--dur-slow) var(--ease-spring),
        scale var(--dur-slow) var(--ease-out);
}
</style>
