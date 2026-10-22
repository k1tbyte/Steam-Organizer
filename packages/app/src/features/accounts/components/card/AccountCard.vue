<script setup lang="ts">
import { FpButton, FpCard, FpIcon, tip } from '@so/ui'
import { type ComponentPublicInstance, computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import { SteamGuardCode } from '#features/steam-guard'

import { useAccountCard } from '../../composables/useAccountCard'
import type { Account, CardFlags } from '../../model'
import AccountCardActions from './AccountCardActions.vue'
import AccountTags from './AccountTags.vue'
import AgeChip from './AgeChip.vue'
import BanLetters from './BanLetters.vue'
import LevelAvatar from './LevelAvatar.vue'

const props = defineProps<{
    account: Account
    flags: CardFlags
    /** The phone card: taller footer and tag row, bigger targets. */
    touch: boolean
}>()
const emit = defineEmits<{
    togglePin: []
    editTags: []
    delete: []
}>()

const { t } = useI18n()
const root = useTemplateRef<ComponentPublicInstance>('root')
const card = useAccountCard(
    props,
    computed(() => root.value?.$el as HTMLElement | undefined),
)
</script>

<template>
    <FpCard
        ref="root"
        flush
        class="card relative min-w-0 p-u-3.5 transition-colors duration-fast hover:border-stroke-2 hover:bg-surface-hover"
        :data-vt-hero="card.isHero.value || undefined"
        :style="{ height: card.height.value }">
        <FpButton
            v-bind="tip(account.pinned ? t('Unpin') : t('Pin'), { label: true })"
            square
            :size="touch ? 'md' : 'xs'"
            :variant="account.pinned ? 'soft' : 'ghost'"
            :color="account.pinned ? 'accent' : 'neutral'"
            :class="!account.pinned && 'text-fg-faint! hover:text-fg-1!'"
            class="absolute z-10"
            :style="{ top: card.pinInset.value, right: card.pinInset.value }"
            @click="emit('togglePin')">
            <FpIcon name="icon-[lucide--pin]" />
        </FpButton>

        <div class="flex h-13.5 shrink-0 items-center gap-u-3.5">
            <LevelAvatar
                :name="account.nickname"
                :hue="account.hue"
                :level="account.level"
                :anonymous="account.anonymous"
                :ring="card.showLevel.value" />
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
                <span class="flex min-w-0 items-center gap-1.5" :class="touch ? 'pr-9' : 'pr-7'">
                    <RouterLink
                        :to="card.profilePath.value"
                        class="truncate font-semibold text-15 text-fg-1 tracking-title">
                        {{ account.nickname }}
                    </RouterLink>
                    <FpIcon v-if="account.locked" v-bind="tip(t('Locked'), { label: true })" name="icon-[lucide--lock]" class="shrink-0 text-13 text-fg-3" />
                </span>
                <div class="flex h-4.5 min-w-0 items-center gap-2 whitespace-nowrap">
                    <AgeChip v-if="card.showAge.value" :years="account.years" :since="account.since" />
                    <button
                        v-if="card.showId.value"
                        v-bind="tip(t('Copy account ID'))"
                        type="button"
                        class="inline-flex min-w-0 cursor-pointer items-center gap-1.25 font-mono text-12 text-fg-3 transition-colors duration-fast hover:text-fg-1"
                        @click="card.copyId">
                        <span class="truncate">{{ card.idText.value }}</span>
                        <FpIcon
                            :name="card.copied.value ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'"
                            class="shrink-0 text-12" />
                    </button>
                    <span class="flex-1" />
                    <BanLetters v-if="card.showBans.value" :bans="account.bans" />
                </div>
            </div>
        </div>

        <AccountTags
            v-if="card.showTags.value"
            :shown="card.shownTags.value"
            :hidden="card.hiddenTags.value"
            :touch="touch"
            @edit="emit('editTags')" />

        <div
            v-if="card.showFooter.value"
            class="mt-auto box-content flex shrink-0 items-center gap-u-2 border-stroke-1 border-t border-dashed pt-u-3"
            :style="{ height: `${card.rows.value.footer}px` }">
            <SteamGuardCode v-if="card.showGuard.value" :seed="account.id" :size="touch ? 'md' : 'sm'" />
            <span
                v-else-if="card.showLockedGuard.value"
                class="inline-flex shrink-0 items-center gap-1.5 text-12 text-fg-faint">
                <FpIcon name="icon-[lucide--lock]" class="text-13" />
                {{ t('Locked') }}
            </span>
            <span v-else-if="card.showNoGuard.value" v-bind="tip(t('No Steam Guard authenticator'))" class="inline-flex shrink-0 items-center gap-1.5 text-12 text-fg-faint">
                <FpIcon name="icon-[lucide--shield-off]" class="text-13" />
                {{ t('No 2FA') }}
            </span>
            <span class="min-w-0 flex-1 truncate text-12.5 text-fg-3">{{ card.note.value }}</span>
            <AccountCardActions
                v-if="flags.actions"
                :touch="touch"
                :profile-path="card.profilePath.value"
                @delete="emit('delete')" />
        </div>
    </FpCard>
</template>

<style scoped>
.card {
    gap: calc(var(--density-unit) * 3 + 4px);
    /* No blur: in a long list it is a backdrop pass per card every scroll frame. */
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background-image: linear-gradient(var(--surf-veil), var(--surf-veil));
}
</style>
