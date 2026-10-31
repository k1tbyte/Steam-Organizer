<script setup lang="ts">
import { FpButton, FpIcon, FpIconTile } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useMoveToDrive } from '../composables/useMoveToDrive'

defineProps<{
    name: string
    /** Synced, but Google is signed out: connect instead of move. */
    disconnected: boolean
}>()

const { t } = useI18n()
const { moveToDrive, moving, connect, connecting, exportFile } = useMoveToDrive()
</script>

<!-- The desktop scroller has no height to centre in, so the area is the viewport minus the topbar. -->
<template>
    <div class="flex min-h-full items-center justify-center px-6 pb-15 lg:min-h-[calc(100dvh-3.75rem)]">
        <div class="flex w-full max-w-105 flex-col items-center gap-4 text-center">
            <FpIconTile size="xl" name="icon-[lucide--cloud-off]" class="size-14! text-24!" />
            <div v-if="disconnected" class="flex flex-col gap-1.5">
                <h2 class="font-title text-20 text-fg-1 tracking-title">
                    {{ t("Google Drive isn't connected") }}
                </h2>
                <p class="text-14 text-fg-3 leading-normal text-pretty">
                    {{ t('Connect it to sync {name} and see its backups.', { name }) }}
                </p>
            </div>
            <div v-else class="flex flex-col gap-1.5">
                <h2 class="font-title text-20 text-fg-1 tracking-title">
                    {{ t('No backups for this vault') }}
                </h2>
                <p class="text-14 text-fg-3 leading-normal text-pretty">
                    {{ t('{name} lives only in this browser. Move it to Google Drive to get backup history and sync, or export a file by hand.', { name }) }}
                </p>
            </div>
            <div class="flex flex-wrap justify-center gap-2 pt-1">
                <FpButton v-if="disconnected" color="accent" size="xl" :loading="connecting" @click="connect">
                    <FpIcon name="icon-[simple-icons--googledrive]" aria-hidden="true" />
                    {{ t('Connect Google Drive') }}
                </FpButton>
                <FpButton v-else color="accent" size="xl" :loading="moving" @click="moveToDrive">
                    <FpIcon name="icon-[simple-icons--googledrive]" aria-hidden="true" />
                    {{ t('Move to Google Drive') }}
                </FpButton>
                <FpButton variant="soft" size="xl" @click="exportFile">
                    <FpIcon name="icon-[lucide--download]" aria-hidden="true" />
                    {{ t('Export file') }}
                </FpButton>
            </div>
        </div>
    </div>
</template>
