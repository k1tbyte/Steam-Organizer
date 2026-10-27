import { useTimer } from '@so/ui/useTimer'
import {
    onScopeDispose,
    ref,
    shallowRef,
    type UnwrapNestedRefs,
    watch,
} from 'vue'

import { usePageActive } from '#core'

import type { Account } from '../../model'
import { useAccountLocks } from '../secrets/useAccountLocks'
import { useUnlockForm } from '../secrets/useUnlockForm'

const DONE_MS = 1400

/** Unlock from the list, one account at a time: those opened here lock again once the page is left. */
export function useUnlockDialog() {
    const locks = useAccountLocks()
    const timer = useTimer()
    const open = ref(false)
    const done = ref(false)
    const account = shallowRef<Account>()
    const opened = new Set<string>()
    const form = useUnlockForm(
        () => account.value?.lock,
        (credential) =>
            account.value
                ? locks.unlock(account.value.id, credential)
                : Promise.resolve(false),
    )

    function relockAll() {
        for (const id of opened) locks.relock(id)
        opened.clear()
    }
    watch(usePageActive(), (active) => {
        if (!active) relockAll()
    })
    onScopeDispose(relockAll)

    return {
        ...form,
        open,
        done,
        account,
        show(target: Account) {
            timer.cancel()
            account.value = target
            form.reset()
            done.value = false
            open.value = true
        },
        async unlock() {
            const target = account.value
            if (!target) return
            // Counted before it opens: leaving the page meanwhile drops it, and the late key with it.
            opened.add(target.id)
            if (!(await form.submit())) return
            done.value = true
            timer.arm(DONE_MS, () => {
                open.value = false
            })
        },
    }
}
export type UnlockDialogState = UnwrapNestedRefs<
    ReturnType<typeof useUnlockDialog>
>
