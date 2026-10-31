import { useToast } from '@so/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSettingsLink } from '#core'
import { useDrive, useDriveProblem } from '#features/drive'
import { useVaultSession } from '#features/vault'

import { useVaultSync } from '../stores/useVaultSync'

/** The vault without Drive history: move one kept on this device to Drive, connect Google for a synced one, or export it by hand. */
export function useMoveToDrive() {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    drive.prepare()
    const engine = useVaultSync()
    const { problemOf } = useDriveProblem()
    const toast = useToast()
    const openSettings = useSettingsLink()
    const moving = ref(false)

    // From the click, so Google may open its window; a closed one is a quiet false.
    async function connect() {
        try {
            return await drive.connect()
        } catch (error) {
            toast.add({
                color: 'danger',
                title: t("Couldn't connect Google Drive"),
                description: problemOf(error).description,
            })
            return false
        }
    }

    /** Links the open vault and syncs it: a copy Drive already has of it is merged, not duplicated. Offline, it pushes later. */
    async function moveToDrive() {
        if (moving.value) return
        moving.value = true
        try {
            const state = drive.state.value
            if (state === 'disconnected' || state === 'expired')
                if (!(await connect())) return
            await session.link()
            await engine.syncNow()
        } finally {
            moving.value = false
        }
    }

    return {
        connecting: drive.connecting,
        moving,
        moveToDrive,
        connect: () => void connect(),
        exportFile: () => openSettings('vault'),
    }
}
