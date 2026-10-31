import { onScopeDispose, ref, watch } from 'vue'

import { usePageActive, useSettingsLink } from '#core'
import { useDrive, useDriveSignIn } from '#features/drive'
import { useVaultSession } from '#features/vault'

import { useVaultSync } from '../stores/useVaultSync'

/** The vault without Drive history: move one kept on this device to Drive, connect Google for a synced one, or export it by hand. */
export function useMoveToDrive() {
    const session = useVaultSession()
    const drive = useDrive()
    drive.prepare()
    const engine = useVaultSync()
    const signIn = useDriveSignIn()
    const openSettings = useSettingsLink()
    const moving = ref(false)

    // Bumped on leaving the page (it stays mounted behind others): a sign-in that ends after links nothing.
    let attempt = 0
    const leave = () => attempt++
    watch(usePageActive(), (active) => active || leave())
    onScopeDispose(leave)

    /** Links the open vault and syncs it: a copy Drive already has of it is merged, not duplicated. Offline, it pushes later.
     *  A sign-in that ends after leaving the page or with another vault open links nothing. */
    async function moveToDrive() {
        const id = session.vault?.id
        if (moving.value || !id) return
        const mine = ++attempt
        moving.value = true
        try {
            const state = drive.state.value
            if (state === 'disconnected' || state === 'expired')
                if (!(await signIn())) return
            if (mine !== attempt || session.vault?.id !== id) return
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
        connect: () => void signIn(),
        exportFile: () => openSettings('vault'),
    }
}
