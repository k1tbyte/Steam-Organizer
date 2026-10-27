<script setup lang="ts">
import { FpButton, FpCard, FpIcon, tip } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { type Account, AccountTagChip, AgeChip, LevelAvatar } from '#features/accounts'
import type { MaFilePick } from '#features/steam-guard'

import type { AliasEditorState } from '../../composables/hero/useAliasEditor'
import type { ProfileHeaderState } from '../../composables/hero/useProfileHeader'
import type { SteamIdFieldState } from '../../composables/hero/useSteamIdField'
import type { AccountGateState } from '../../composables/lock/useAccountGate'
import type { BansState } from '../../composables/useBans'
import ProfileChip from '../ProfileChip.vue'
import AliasTitle from './AliasTitle.vue'
import GuardBar from './GuardBar.vue'
import GuardMissing from './GuardMissing.vue'
import ProfileMeta from './ProfileMeta.vue'
import SteamIdField from './SteamIdField.vue'
import SteamLinks from './SteamLinks.vue'

defineProps<{
    account: Account
    header: ProfileHeaderState
    bans: BansState
    idField: SteamIdFieldState
    gate: AccountGateState
    alias: AliasEditorState
    /** A maFile that failed to import, shown in place of the Import row. */
    guardFailed: MaFilePick | null
}>()
const emit = defineEmits<{ togglePin: []; editTags: [anchor: HTMLElement]; importMaFile: [] }>()

const { t } = useI18n()
const editTags = (event: MouseEvent) => emit('editTags', event.currentTarget as HTMLElement)
</script>

<template>
    <FpCard flush data-vt-hero class="shrink-0">
        <div class="flex items-center gap-u-5 px-u-5 pt-u-5 pb-u-6">
            <LevelAvatar
                size="xl"
                :name="account.nickname"
                :hue="account.hue"
                :avatar="account.avatar"
                :level="account.level"
                :anonymous="account.anonymous"
                :ring="!gate.hidesProfile" />
            <div class="flex min-w-0 flex-1 flex-col gap-2.5">
                <AliasTitle :account="account" :editor="alias" :touch="false">
                    <ProfileChip v-if="gate.chip" v-bind="tip(t('Account has its own password'))" tone="accent" :icon="gate.chip.icon">{{ gate.chip.label }}</ProfileChip>
                    <ProfileChip v-if="!gate.hidesProfile && header.visibility" v-bind="tip(t('Profile visibility'))" :icon="header.visibility.icon">{{ header.visibility.label }}</ProfileChip>
                    <FpButton
                        v-if="!gate.hidesProfile"
                        v-bind="tip(account.pinned ? t('Unpin') : t('Pin'))"
                        square
                        size="xs"
                        :variant="account.pinned ? 'soft' : 'ghost'"
                        :color="account.pinned ? 'accent' : 'neutral'"
                        :class="!account.pinned && 'text-fg-faint! hover:text-fg-1!'"
                        :aria-label="account.pinned ? t('Unpin') : t('Pin')"
                        @click="emit('togglePin')">
                        <FpIcon name="icon-[lucide--pin]" />
                    </FpButton>
                </AliasTitle>
                <template v-if="!gate.hidesProfile">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <AgeChip v-if="account.since" size="md" :years="account.years" :since="account.since" />
                        <span v-if="account.since" class="mr-1.5 text-12.5 text-fg-3">
                            {{ t('since {since}', { since: account.since }) }}
                        </span>
                        <AccountTagChip v-for="tag in account.tags" :key="tag.id" :tag="tag" />
                        <button
                            v-bind="tip(t('Edit tags'))"
                            type="button"
                            :aria-label="t('Edit tags')"
                            class="grid size-5.5 cursor-pointer place-items-center rounded-full text-13 text-fg-3 transition-colors duration-fast hover:bg-hover hover:text-fg-1"
                            @click="editTags">
                            <FpIcon name="icon-[lucide--plus]" />
                        </button>
                    </div>
                    <SteamLinks v-if="header.links.length > 0" :links="header.links" :touch="false" />
                </template>
            </div>
            <!-- Steam Guard needs no Steam profile: an anonymous account keeps it. -->
            <div v-if="!gate.hidesProfile" class="flex w-75 shrink-0 flex-col gap-2">
                <SteamIdField v-if="!account.anonymous" :field="idField" :touch="false" />
                <GuardMissing
                    v-if="!account.guard"
                    :touch="false"
                    :failed="guardFailed"
                    :login="account.login"
                    @import-ma-file="emit('importMaFile')" />
                <GuardBar v-else-if="!gate.locked" :seed="account.id" :touch="false" />
            </div>
        </div>
        <div
            v-if="!gate.hidesProfile"
            class="flex items-center gap-u-8 border-stroke-1 border-t px-u-5 py-u-3">
            <ProfileMeta :meta="header.meta" :touch="false" />
            <span class="flex-1" />
            <ProfileChip v-if="!account.anonymous" size="md" :tone="bans.banned ? 'danger' : 'success'" :icon="bans.icon">
                {{ bans.summary }}
            </ProfileChip>
        </div>
    </FpCard>
</template>
