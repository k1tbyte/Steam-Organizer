<script setup lang="ts">
import { FpButton, FpIcon, FpIconTile } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useDriveAccount } from '../composables/useDriveAccount'

defineProps<{ name: string }>()

const { t } = useI18n()
const { connect, connecting } = useDriveAccount()
</script>

<!-- Export is shown only: it waits on the vault export. The desktop scroller has no height to centre in, so the area is the viewport minus the topbar. -->
<template>
    <div class="flex min-h-full items-center justify-center px-6 pb-15 lg:min-h-[calc(100dvh-3.75rem)]">
        <div class="flex w-full max-w-105 flex-col items-center gap-4 text-center">
            <FpIconTile size="xl" name="icon-[lucide--cloud-off]" class="size-14! text-24!" />
            <div class="flex flex-col gap-1.5">
                <h2 class="font-title text-20 text-fg-1 tracking-title">
                    {{ t('No backups for this vault') }}
                </h2>
                <p class="text-14 text-fg-3 leading-normal text-pretty">
                    {{ t('{name} lives only in this browser. Connect Google Drive to keep its backup history, or export a file by hand.', { name }) }}
                </p>
            </div>
            <div class="flex flex-wrap justify-center gap-2 pt-1">
                <FpButton color="accent" size="xl" :loading="connecting" @click="connect">
                    <FpIcon name="icon-[simple-icons--googledrive]" aria-hidden="true" />
                    {{ t('Connect Google Drive') }}
                </FpButton>
                <FpButton variant="soft" size="xl">
                    <FpIcon name="icon-[lucide--download]" aria-hidden="true" />
                    {{ t('Export file') }}
                </FpButton>
            </div>
        </div>
    </div>
</template>
