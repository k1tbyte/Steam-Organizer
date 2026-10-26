<script setup lang="ts">
import { FpButton, FpIcon, FpIconTile } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { MaFilePick } from '#features/steam-guard'

defineProps<{ touch: boolean; failed: MaFilePick | null; login: string }>()
const emit = defineEmits<{ importMaFile: [] }>()

const { t } = useI18n()
</script>

<template>
    <div v-if="failed" class="flex flex-col gap-2.5 rounded bg-danger-soft p-3">
        <div class="flex items-center gap-2.5">
            <FpIconTile :name="failed.problem === 'broken' ? 'icon-[lucide--file-x-2]' : 'icon-[lucide--user-x]'" color="danger" size="sm" />
            <div class="flex min-w-0 flex-col">
                <span class="font-semibold text-13 text-fg-1">
                    {{ failed.problem === 'broken' ? t('Can\'t read this file') : t('This maFile is for another account') }}
                </span>
                <span class="truncate font-mono text-12 text-fg-3">{{ failed.name }}</span>
            </div>
        </div>
        <span v-if="failed.problem === 'broken'" class="text-12.5 leading-snug text-fg-2">
            {{ t('It isn\'t a valid maFile: shared_secret is missing. Encrypted files from SDA need to be decrypted there first.') }}
        </span>
        <dl v-else-if="failed.problem === 'another'" class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-12.5">
            <dt class="text-fg-3">{{ t('In the file') }}</dt>
            <dd class="truncate font-mono text-fg-1">{{ failed.inFile }}</dd>
            <dt class="text-fg-3">{{ t('This account') }}</dt>
            <dd class="truncate font-mono text-fg-1">{{ login }}</dd>
        </dl>
        <FpButton :size="touch ? 'lg' : 'sm'" variant="soft" block @click="emit('importMaFile')">
            <FpIcon name="icon-[lucide--folder-open]" />
            {{ t('Choose another file') }}
        </FpButton>
    </div>
    <div
        v-else
        class="flex items-center gap-2 rounded border border-stroke-2 border-dashed pr-1.5 pl-3 text-12.5 text-fg-3"
        :class="touch ? 'h-12' : 'h-9.5'">
        <FpIcon name="icon-[lucide--shield-off]" class="text-15" />
        <span class="flex-1">{{ t('No Steam Guard') }}</span>
        <FpButton size="xs" variant="ghost" color="accent" :label="t('Import maFile')" @click="emit('importMaFile')" />
    </div>
</template>
