import { onKeyStroke } from '@vueuse/core'
import {
    computed,
    type MaybeRefOrGetter,
    ref,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'

import { usePageActive } from '#core'
import { type Account, steamNameOf, useVaultAccounts } from '#features/accounts'

/** Renames the account in place: Enter or leaving the field saves, Esc cancels, an empty name brings the Steam nickname back. F2 starts it. */
export function useAliasEditor(
    account: MaybeRefOrGetter<Account>,
    allowed: MaybeRefOrGetter<boolean>,
) {
    const { edit } = useVaultAccounts()
    const active = usePageActive()
    const editing = ref(false)
    const draft = ref('')
    // An anonymous account has no Steam nickname to fall back to.
    const clears = computed(() => toValue(account).steamNickname !== null)

    function start() {
        draft.value = toValue(account).alias ?? ''
        editing.value = true
    }

    onKeyStroke('F2', (event) => {
        const field =
            event.target instanceof Element &&
            event.target.closest('input, textarea, [contenteditable]')
        if (!active.value || !toValue(allowed) || editing.value || field) return
        event.preventDefault()
        start()
    })

    return {
        editing,
        draft,
        clears,
        allowed: computed(() => toValue(allowed)),
        steamName: computed(() => steamNameOf(toValue(account))),
        offersAlias: computed(
            () => toValue(allowed) && toValue(account).alias === null,
        ),
        start,
        // Blur follows Enter and Esc too: it finds the edit already closed.
        save() {
            if (!editing.value) return
            editing.value = false
            const { id, alias } = toValue(account)
            const next = draft.value.trim() || null
            if (next === alias || (next === null && !clears.value)) return
            void edit(id, { alias: next ?? undefined })
        },
        cancel() {
            editing.value = false
        },
    }
}

export type AliasEditorState = UnwrapNestedRefs<
    ReturnType<typeof useAliasEditor>
>
