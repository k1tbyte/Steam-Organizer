import { fetchProfiles, resolveSteamId, type SteamSnapshot } from '@so/core'
import { useTimer } from '@so/ui/useTimer'
import { onScopeDispose, shallowRef, watch } from 'vue'

import {
    type SteamProblem,
    useSteamApi,
    useSteamKey,
    useSteamProblem,
} from '#features/steam'

const DEBOUNCE_MS = 400

export type SteamLookup =
    | { status: 'idle' | 'looking' | 'missing' }
    | { status: 'found'; steamId: string; profile: SteamSnapshot }
    | { status: 'failed'; problem: SteamProblem }

/** The Steam profile behind `input` (null: nothing to look up). Every change restarts it, and a key saved meanwhile restarts
 *  one that failed on the key (Open Settings fixes it); a reply to an older input is dropped. */
export function useSteamLookup(input: () => string | null) {
    const steam = useSteamApi()
    const { problemOf } = useSteamProblem()
    const timer = useTimer()
    const state = shallowRef<SteamLookup>({ status: 'idle' })
    let run = 0

    async function look(typed: string) {
        const current = ++run
        state.value = { status: 'looking' }
        try {
            const api = await steam.api()
            const steamId = await resolveSteamId(api, typed)
            const profile =
                steamId === null
                    ? undefined
                    : (await fetchProfiles(api, [steamId])).get(steamId)
            if (current !== run) return
            state.value =
                steamId !== null && profile
                    ? { status: 'found', steamId, profile }
                    : { status: 'missing' }
        } catch (error) {
            if (current === run)
                state.value = { status: 'failed', problem: problemOf(error) }
        }
    }

    function restart(typed: string | null) {
        timer.cancel()
        run++
        if (typed === null) {
            state.value = { status: 'idle' }
            return
        }
        state.value = { status: 'looking' }
        timer.arm(DEBOUNCE_MS, () => void look(typed))
    }
    watch(input, restart)
    watch(useSteamKey().key, () => {
        const failed = state.value
        if (failed.status === 'failed' && failed.problem.fix === 'settings')
            restart(input())
    })
    onScopeDispose(() => run++)

    return {
        state,
        retry() {
            const typed = input()
            if (typed !== null) void look(typed)
        },
    }
}
