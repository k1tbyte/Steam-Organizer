import { useTimer } from '@so/ui/useTimer'
import {
    computed,
    type MaybeRefOrGetter,
    onScopeDispose,
    ref,
    shallowRef,
    toValue,
} from 'vue'

import { type Account, useVaultAccounts } from '#features/accounts'
import { useVaultSession } from '#features/vault'

import { NOTE_MAX_LENGTH } from '../model'
import { useProfileNotesStore } from '../stores/profileNotes'

// Each save reseals the vault, so typing waits for a pause.
const SAVE_MS = 800
const SAVED_SHOWN_MS = 2000

export type NoteStatus = 'saving' | 'saved' | 'failed'

/** The account's note: typed text shows at once and reaches the vault after a pause, on leaving the field, or when the page goes or the vault locks. */
export function useProfileNote(account: MaybeRefOrGetter<Account>) {
    const notes = useProfileNotesStore()
    const { edit } = useVaultAccounts()
    const timer = useTimer()
    const fade = useTimer()
    let unsaved: string | null = null
    // Only the latest save speaks, and only once no newer text waits: it carries the whole note.
    let latest = 0
    const last = shallowRef<{ id: string; status: NoteStatus } | null>(null)
    const faded = ref(false)

    function report(id: string, status: NoteStatus) {
        last.value = { id, status }
        faded.value = false
        if (status === 'saved')
            fade.arm(SAVED_SHOWN_MS, () => {
                faded.value = true
            })
        else fade.cancel()
    }

    function save() {
        if (unsaved === null) return
        const id = unsaved
        unsaved = null
        const note = notes.edited[id]
        if (note === undefined) return
        const ticket = ++latest
        const settle = (saved: boolean) => () => {
            notes.settle(id, saved)
            if (ticket === latest && unsaved !== id)
                report(id, saved ? 'saved' : 'failed')
        }
        edit(id, { note }).then(settle(true), settle(false))
    }
    // A draft whose save failed, on this page or an earlier one, goes again when the page goes or the vault locks.
    function flush() {
        const { id } = toValue(account)
        if (unsaved === null && notes.failed.has(id)) unsaved = id
        save()
    }
    onScopeDispose(flush)
    onScopeDispose(useVaultSession().onBeforeLock(flush))

    const note = computed({
        get: () => notes.edited[toValue(account).id] ?? toValue(account).note,
        set: (text: string) => {
            const { id } = toValue(account)
            if (unsaved !== id) save()
            notes.set(id, text)
            unsaved = id
            report(id, 'saving')
            timer.arm(SAVE_MS, save)
        },
    })

    const status = computed(() => {
        const { id } = toValue(account)
        const local = last.value?.id === id ? last.value.status : null
        return local !== 'saving' && notes.failed.has(id) ? 'failed' : local
    })

    return {
        note,
        count: computed(() => `${note.value.length} / ${NOTE_MAX_LENGTH}`),
        status,
        /** "Saved" fades out a moment after it shows; the other states stay. */
        faded,
        save,
        retry() {
            const { id } = toValue(account)
            unsaved = id
            report(id, 'saving')
            save()
        },
    }
}
