<script setup lang="ts">
import { FpIcon } from '@so/ui'
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
const emit = defineEmits<{ editTags: [anchor: HTMLElement]; importMaFile: [] }>()

const { t } = useI18n()
const editTags = (event: MouseEvent) => emit('editTags', event.currentTarget as HTMLElement)
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex items-center gap-4 pb-1">
            <LevelAvatar
                size="lg"
                :name="account.nickname"
                :hue="account.hue"
                :level="account.level"
                :anonymous="account.anonymous"
                :ring="!gate.hidesProfile" />
            <div class="flex min-w-0 flex-1 flex-col gap-2">
                <AliasTitle :account="account" :editor="alias" touch />
                <div class="flex flex-wrap items-center gap-1.5">
                    <ProfileChip v-if="gate.chip" size="lg" tone="accent" :icon="gate.chip.icon">
                        {{ gate.chip.label }}
                    </ProfileChip>
                    <template v-if="!gate.hidesProfile && !account.anonymous">
                        <AgeChip size="md" :years="account.years" :since="account.since" />
                        <ProfileChip v-if="!gate.chip" size="lg" :icon="header.visibility.icon">
                            {{ header.visibility.label }}
                        </ProfileChip>
                        <ProfileChip size="lg" :tone="bans.banned ? 'danger' : 'success'" :icon="bans.icon">
                            {{ bans.summary }}
                        </ProfileChip>
                    </template>
                </div>
            </div>
        </div>
        <template v-if="!gate.hidesProfile">
            <div class="flex flex-wrap items-center gap-1.5">
                <AccountTagChip v-for="tag in account.tags" :key="tag.id" :tag="tag" size="lg" />
                <button
                    type="button"
                    :aria-label="t('Edit tags')"
                    class="grid size-7.5 cursor-pointer place-items-center rounded-full text-14 text-fg-3 ring-1 ring-stroke-2 ring-inset"
                    @click="editTags">
                    <FpIcon name="icon-[lucide--plus]" />
                </button>
            </div>
            <SteamIdField v-if="!account.anonymous" :field="idField" touch />
            <GuardMissing
                    v-if="!account.guard"
                    touch
                    :failed="guardFailed"
                    :login="account.login"
                    @import-ma-file="emit('importMaFile')" />
            <GuardBar v-else-if="!gate.locked" :seed="account.id" touch />
            <SteamLinks v-if="!account.anonymous" :links="header.links" touch />
            <ProfileMeta :meta="header.meta" touch />
        </template>
    </div>
</template>
