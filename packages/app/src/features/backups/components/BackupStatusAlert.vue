<script setup lang="ts">
import { FpAlert, FpButton, useDesktopLayout } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDriveAccount } from '../composables/useDriveAccount'
import { useSyncStatus } from '../composables/useSyncStatus'

const { t } = useI18n()
const desktop = useDesktopLayout()
const status = useSyncStatus()
const { connect, connecting } = useDriveAccount()
const state = computed(() => status.value?.state)
</script>

<template>
    <FpAlert
        v-if="state === 'error'"
        color="danger"
        icon="icon-[lucide--cloud-alert]"
        :title="t(`Couldn't reach Google Drive`)"
        :description="
            desktop
                ? t('Sign-in expired. Changes stay on this device until you sign in again.')
                : t('Sign-in expired. Changes stay on this device.')
        ">
        <template v-if="desktop" #trailing>
            <FpButton
                color="danger"
                size="sm"
                :label="t('Sign in again')"
                :loading="connecting"
                @click="connect" />
        </template>
        <template v-else #actions>
            <FpButton
                block
                color="danger"
                size="xl"
                :label="t('Sign in again')"
                :loading="connecting"
                @click="connect" />
        </template>
    </FpAlert>
    <FpAlert
        v-else-if="state === 'offline'"
        icon="icon-[lucide--wifi-off]"
        :title="t(`You're offline`)"
        :description="
            desktop
                ? t(`The vault works as usual. Backups and sync resume when you're back online.`)
                : t(`Backups and sync resume when you're back online.`)
        " />
</template>
