import { useTimer } from '@so/ui/useTimer'
import { computed, type MaybeRefOrGetter, onScopeDispose, toValue } from 'vue'

import { type Account, useVaultAccounts } from '#features/accounts'
import { useVaultSession } from '#features/vault'

import { NOTE_MAX_LENGTH } from '../model'
import { useProfileNotesStore } from '../stores/profileNotes'

// Each save reseals the vault, so typing waits for a pause.
const SAVE_MS = 600

/** The account's note: typed text shows at once and reaches the vault after a pause, or when the page goes or the vault locks. */
export function useProfileNote(account: MaybeRefOrGetter<Account>) {
    const notes = useProfileNotesStore()
    const { edit } = useVaultAccounts()
    const timer = useTimer()
    let unsaved: string | null = null

    function save() {
        if (unsaved === null) return
        const id = unsaved
        unsaved = null
        const note = notes.edited[id]
        if (note !== undefined) void edit(id, { note })
    }
    onScopeDispose(save)
    onScopeDispose(useVaultSession().onBeforeLock(save))

    const note = computed({
        get: () => notes.edited[toValue(account).id] ?? toValue(account).note,
        set: (text: string) => {
            const { id } = toValue(account)
            if (unsaved !== id) save()
            notes.set(id, text)
            unsaved = id
            timer.arm(SAVE_MS, save)
        },
    })

    return {
        note,
        count: computed(() => `${note.value.length} / ${NOTE_MAX_LENGTH}`),
    }
}
