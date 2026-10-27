import { useToast } from '@so/ui'
import {
    computed,
    type MaybeRefOrGetter,
    onScopeDispose,
    shallowRef,
    toValue,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { type Account, useSteamRefresh } from '#features/accounts'
import { useSteamProblem } from '#features/steam'

/** Refresh from Steam for the open account; a failure or a gone profile says so in a toast. */
export function useProfileRefresh(
    account: MaybeRefOrGetter<Account>,
    hidden: MaybeRefOrGetter<boolean>,
) {
    const { t } = useI18n()
    const toast = useToast()
    const steam = useSteamRefresh()
    const { problemOf, openSteamSettings } = useSteamProblem()
    const refreshing = shallowRef(false)
    // A reply after the page left (or the vault locked and cleared its toasts) toasts nothing.
    let left = false
    onScopeDispose(() => {
        left = true
    })

    async function refresh() {
        if (refreshing.value) return
        refreshing.value = true
        try {
            const { missing } = await steam.refresh([toValue(account).id])
            if (missing.length > 0 && !left)
                toast.add({
                    title: t('Steam has no profile with this ID'),
                    description: t('It may have been deleted.'),
                    color: 'warning',
                })
        } catch (error) {
            const problem = problemOf(error)
            if (left) return
            toast.add({
                title: problem.title,
                description: problem.description,
                color: 'warning',
                icon: problem.icon,
                action:
                    problem.fix === 'settings'
                        ? {
                              label: t('Open Settings'),
                              onClick: openSteamSettings,
                          }
                        : { label: t('Retry'), onClick: refresh },
            })
        } finally {
            refreshing.value = false
        }
    }

    return {
        refreshing,
        /** Web can't reach Steam; an anonymous account has no profile; a closed lock hides its Steam ID. */
        refreshable: computed(
            () =>
                steam.reachable &&
                !toValue(account).anonymous &&
                !toValue(hidden),
        ),
        refresh,
    }
}
