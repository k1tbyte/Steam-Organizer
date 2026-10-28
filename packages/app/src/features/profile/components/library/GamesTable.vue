<script setup lang="ts">
import { FpCard, FpIcon } from '@so/ui'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePageRows } from '#core'
import type { GamesTableState } from '../../composables/library/useGamesTable'

const props = defineProps<{ table: GamesTableState; desktop: boolean }>()

const { t } = useI18n()
const list = useTemplateRef('list')
// The rows' `h-15` and `h-16`.
const rows = usePageRows(
    computed(() => props.table.games),
    list,
    () => (props.desktop ? 60 : 64),
    (game) => String(game.appId),
)
const shown = computed(() => rows.items.value.map((item) => ({ ...item, game: props.table.rowOf(item.row) })))

// A game without store art keeps its initials tile.
function hideBroken(event: Event) {
    ;(event.target as HTMLElement).hidden = true
}
</script>

<!-- Only the rows near the viewport render, keyed by slot. The image keys by its URL, so a row taking another game
     never inherits a hidden broken image. -->
<template>
    <FpCard flush class="pb-1">
        <div v-if="desktop" class="games-grid h-9.5 border-stroke-1 border-b px-4">
            <button
                v-for="column in table.columns"
                :key="column.key"
                type="button"
                class="flex h-full items-center gap-1 font-medium text-12 hover:text-fg-1"
                :class="[column.on ? 'text-fg-1' : 'text-fg-3', column.key === 'price' && 'justify-end']"
                @click="table.sortBy(column.key)">
                {{ column.label }}
                <FpIcon v-if="column.on" :name="table.sortIcon" class="text-accent-ink" />
            </button>
        </div>
        <div ref="list" class="relative" :style="{ height: `${rows.totalSize.value}px` }">
            <a
                v-for="item in shown"
                :key="item.slot"
                :href="item.game.store"
                target="_blank"
                rel="noopener"
                class="absolute inset-x-0 top-0 hover:bg-hover"
                :class="desktop ? 'games-grid h-15 px-4' : 'flex h-16 items-center gap-3 pr-3.5 pl-3'"
                :style="{ transform: `translateY(${item.top}px)` }">
                <span class="flex min-w-0 flex-1 items-center gap-3">
                    <span
                        class="game-tile relative grid shrink-0 place-items-center overflow-hidden font-mono font-semibold text-fg-2"
                        :class="desktop ? 'h-10.75 w-23 text-12' : 'h-8.5 w-18 text-10'"
                        :style="{ '--hue': item.game.hue }">
                        {{ item.game.initials }}
                        <img
                            :key="item.game.image"
                            :src="item.game.image"
                            alt=""
                            decoding="async"
                            class="absolute inset-0 size-full object-cover"
                            @error="hideBroken" />
                    </span>
                    <span class="flex min-w-0 flex-col gap-0.75">
                        <span class="truncate font-medium text-fg-1" :class="desktop ? 'text-13.5' : 'text-14'">
                            {{ item.game.name }}
                        </span>
                        <span v-if="!desktop" class="truncate text-12 text-fg-3">{{ item.game.summary }}</span>
                    </span>
                </span>
                <template v-if="desktop">
                    <span class="flex flex-col gap-1.5">
                        <span class="font-medium font-mono text-13" :class="item.game.played ? 'text-fg-1' : 'text-fg-faint'">
                            {{ item.game.playtime }}
                        </span>
                        <span class="block h-0.75 overflow-hidden rounded-full bg-stroke-1">
                            <span class="block h-full rounded-full bg-accent" :style="{ width: item.game.bar }" />
                        </span>
                    </span>
                    <span class="text-13 text-fg-2">{{ item.game.recent }}</span>
                </template>
                <span
                    class="shrink-0 text-right font-medium font-mono"
                    :class="[desktop ? 'text-12.5' : 'text-12', item.game.priced ? 'text-fg-2' : 'text-fg-3']">
                    {{ item.game.price }}
                </span>
            </a>
        </div>
        <p v-if="table.noMatch" class="px-4 pt-10 pb-9 text-center text-13 text-fg-3">
            {{ t('No games match this search') }}
        </p>
    </FpCard>
</template>

<style scoped>
.games-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 180px 128px 96px;
    column-gap: 16px;
    align-items: center;
}
.game-tile {
    --tile-l: 0.3;
    background: oklch(var(--tile-l) 0.04 var(--hue));
    border-radius: calc(var(--radius-base) * 0.3);
}
:global([data-mode='light']) .game-tile {
    --tile-l: 0.86;
}
</style>
