import { useToast } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSteamApi, useSteamProblem } from '#features/steam'

import type { RefreshProgress } from '../../model'
import {
    type RefreshResult,
    useBulkRefreshStore,
} from '../../stores/bulkRefresh'
import { useAccountsSource } from '../useAccountsSource'

/** Refresh all (skips accounts refreshed within the hour) and the edit bar's batch; the run and its summary toast outlive the page. */
export function useBulkRefresh() {
    const { t } = useI18n()
    const toast = useToast()
    const store = useBulkRefreshStore()
    const { sample, onVault } = useAccountsSource()
    const { problemOf, openSteamSettings } = useSteamProblem()

    function summary(result: RefreshResult) {
        const counts: [number, string][] = [
            [result.updated, t('{count} updated', { count: result.updated })],
            [result.fresh, t('{count} already fresh', { count: result.fresh })],
            [result.missing, t('{count} not found', { count: result.missing })],
            [
                result.left.length,
                t('{count} left', { count: result.left.length }),
            ],
        ]
        return counts.flatMap(([count, text]) => (count > 0 ? [text] : []))
    }

    function report(result: RefreshResult) {
        if (result.error !== undefined) {
            const problem = problemOf(result.error)
            toast.add({
                title: problem.title,
                description: [...summary(result), problem.description].join(
                    ' · ',
                ),
                color: 'warning',
                icon: problem.icon,
                action:
                    problem.fix === 'settings'
                        ? {
                              label: t('Open Settings'),
                              onClick: openSteamSettings,
                          }
                        : {
                              label: t('Retry'),
                              // Busy with another run: the failure stays on screen for later.
                              onClick: () =>
                                  store.run
                                      ? report(result)
                                      : void run(result.left, false),
                          },
            })
            return
        }
        const reached = result.updated + result.missing + result.left.length
        if (reached === 0) {
            toast.add({
                title:
                    result.fresh > 0
                        ? t('All accounts are up to date')
                        : t('No Steam accounts to refresh'),
                color: 'info',
            })
            return
        }
        toast.add({
            title:
                result.left.length > 0
                    ? t('Refresh stopped')
                    : t('Refresh finished'),
            description: summary(result).join(' · '),
            color: result.missing > 0 ? 'warning' : 'success',
        })
    }

    async function run(ids: readonly string[], skipFresh: boolean) {
        // A sample takes nothing.
        if (!onVault.value) return
        const result = await store.start(ids, skipFresh)
        if (result) report(result)
    }

    return {
        /** Web can't reach Steam. */
        available: useSteamApi().reachable,
        running: computed(() => store.run !== null),
        stopping: computed(() => store.run?.stopping === true),
        progress: computed<RefreshProgress | null>(() => {
            const current = store.run
            if (!current || current.total === 0) return null
            return {
                remaining: current.total - current.done,
                progress: current.done / current.total,
            }
        }),
        refreshAll: () =>
            run(
                (sample.value?.accounts ?? []).map((account) => account.id),
                true,
            ),
        refreshPicked: (ids: readonly string[]) => run(ids, false),
        stop: store.stop,
    }
}
