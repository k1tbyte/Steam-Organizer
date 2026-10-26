import { useToast } from '@so/ui/useToast'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'

import { useVaultSession } from '../stores/useVaultSession'

const UNDO_MS = 8000

interface UndoDelete {
    /** Writes the deletion; resolves to its undo. */
    remove: () => Promise<() => Promise<void>>
    title: string
    /** What the error toast says when the deletion fails. */
    failed: string
    /** A toast once Undo has put it back. */
    restored?: { title: string; description: string }
    /** `reportError` scope. */
    scope: string
}

/** A deletion with a toast that offers Undo for `UNDO_MS`, counting down; a failure is reported and said. */
export function useUndoDelete() {
    const { t } = useI18n()
    const toast = useToast()
    const session = useVaultSession()
    // A lock clears the toasts; a write that lands after it must not bring one back.
    const unlocked = () => session.state === 'unlocked'

    async function restore(
        undo: () => Promise<void>,
        { restored, scope }: UndoDelete,
    ) {
        try {
            await undo()
        } catch (error) {
            reportError(error, scope)
            toast.add({ color: 'danger', title: t("Couldn't restore") })
            return
        }
        if (restored && unlocked())
            toast.add({
                color: 'success',
                icon: 'icon-[lucide--undo-2]',
                ...restored,
            })
    }

    return async (deletion: UndoDelete) => {
        let undo: () => Promise<void>
        try {
            undo = await deletion.remove()
        } catch (error) {
            reportError(error, deletion.scope)
            toast.add({ color: 'danger', title: deletion.failed })
            return
        }
        if (!unlocked()) return
        toast.add({
            title: deletion.title,
            description: (seconds) => t('Undo for {seconds} s', { seconds }),
            icon: 'icon-[lucide--trash-2]',
            duration: UNDO_MS,
            progress: true,
            action: {
                label: t('Undo'),
                onClick: () => void restore(undo, deletion),
            },
        })
    }
}
