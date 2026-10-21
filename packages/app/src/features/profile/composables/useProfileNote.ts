import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import type { Account } from '#features/accounts'

import { NOTE_MAX_LENGTH } from '../model'
import { useProfileNotesStore } from '../stores/profileNotes'

/** The account's note: edited text kept for the session over the vault's own. */
export function useProfileNote(account: MaybeRefOrGetter<Account>) {
    const notes = useProfileNotesStore()

    const note = computed({
        get: () => notes.edited[toValue(account).id] ?? toValue(account).note,
        set: (text: string) => notes.set(toValue(account).id, text),
    })

    return {
        note,
        count: computed(() => `${note.value.length} / ${NOTE_MAX_LENGTH}`),
    }
}
