<script setup lang="ts">
import { FpButton, FpCard, FpIcon } from '@so/ui'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { usePageRows } from '#core'
import { LevelAvatar } from '#features/accounts'
import type { FriendsListState } from '../../composables/library/useFriendsList'

const props = defineProps<{ list: FriendsListState; desktop: boolean }>()

const { t } = useI18n()
const body = useTemplateRef('body')
// Desktop: rows of three `h-16` cards and an 8px gap; phones: one `h-16.5` row each.
const grid = usePageRows(
    computed(() => props.list.rows(props.desktop ? 3 : 1)),
    body,
    () => (props.desktop ? 72 : 66),
    (row) => row[0]?.steamId ?? '',
)
const shown = computed(() =>
    grid.items.value.map((item) => ({ ...item, cards: item.row.map((friend) => props.list.cardOf(friend)) })),
)
</script>

<!-- Only the rows near the viewport render, keyed by slot; a card opens the friend's Steam profile, In vault its
     account here. -->
<template>
    <component :is="desktop ? 'div' : FpCard" :flush="desktop ? undefined : true" class="max-lg:py-1">
        <div ref="body" class="relative" :style="{ height: `${grid.totalSize.value}px` }">
            <div
                v-for="item in shown"
                :key="item.slot"
                class="absolute inset-x-0 top-0"
                :class="desktop && 'grid grid-cols-3 gap-2'"
                :style="{ transform: `translateY(${item.top}px)` }">
                <component
                    :is="desktop ? FpCard : 'div'"
                    v-for="(card, column) in item.cards"
                    :key="column"
                    :flush="desktop ? true : undefined"
                    class="flex-row items-center gap-3 pr-3 pl-3.5"
                    :class="desktop ? 'friend h-16' : 'flex h-16.5'">
                    <a
                        :href="card.profile"
                        target="_blank"
                        rel="noopener"
                        class="flex min-w-0 flex-1 items-center gap-3">
                        <LevelAvatar size="sm" :name="card.name" :hue="card.hue" :avatar="card.avatar" :level="0" />
                        <span class="flex min-w-0 flex-col gap-0.75">
                            <span class="truncate font-semibold text-fg-1" :class="desktop ? 'text-13.5' : 'text-14'">
                                {{ card.name }}
                            </span>
                            <span v-if="card.since" class="truncate text-fg-3" :class="desktop ? 'text-11.5' : 'text-12'">
                                {{ card.since }}
                            </span>
                        </span>
                    </a>
                    <FpButton
                        v-if="card.vaultPath"
                        :as="RouterLink"
                        :to="card.vaultPath"
                        round
                        size="xs"
                        variant="soft"
                        color="accent"
                        class="shrink-0">
                        <FpIcon name="icon-[lucide--vault]" />
                        {{ t('In vault') }}
                    </FpButton>
                </component>
            </div>
        </div>
        <p v-if="list.noMatch" class="px-4 pt-10 pb-9 text-center text-13 text-fg-3">
            {{ t('No friends match this filter') }}
        </p>
    </component>
</template>

<style scoped>
/* No blur: in a long list it is a backdrop pass per card every scroll frame. */
.friend {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background-image: linear-gradient(var(--surf-veil), var(--surf-veil));
}
</style>
