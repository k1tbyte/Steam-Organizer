import { useTimer } from '@so/ui/useTimer'
import { useEventListener } from '@vueuse/core'
import { watch } from 'vue'

import { reportError, SECURITY_SETTINGS_STORAGE_KEY } from '#core'

import { readActive, writeActive } from '../services/device/keptEntry'
import { idleLeft, readSecuritySettings } from '../services/device/lockPolicy'
import { useLockPolicy } from '../stores/useLockPolicy'
import { useVaultSession } from '../stores/useVaultSession'

// Activity is written to the shared stamp at most this often.
const STAMP_EVERY_MS = 15_000
const ACTIVITY: string[] = [
    'pointerdown',
    'pointermove',
    'keydown',
    'wheel',
    'touchstart',
]

export interface AutoLockOptions {
    /** A page that is never visible (the vault host): Immediately holds it locked, as for a hidden page. */
    hidden?: boolean
}

/** Locks the page by the lock policy: after the idle time every page of the browser shares, and for Immediately when
 *  it is hidden. Watches only this page; the session locks and restores across pages. Call once per page. */
export function useAutoLock({ hidden = false }: AutoLockOptions = {}) {
    const session = useVaultSession()
    const policy = useLockPolicy()
    const timer = useTimer()
    // This page's own latest activity: the shared stamp lags it by up to the write interval.
    let active = Date.now()
    let stamped = 0

    // A mock session holds no vault: there is nothing to lock for real.
    const open = () => session.state === 'unlocked' && session.vault !== null

    /** Ms of idle time left, or null where the policy has none. Another page's activity moves it too. */
    async function idleTime(local: number) {
        const shared = await readActive()
        return idleLeft(
            readSecuritySettings(),
            Math.max(shared ?? 0, local),
            Date.now(),
        )
    }

    async function check(local = active) {
        timer.cancel()
        if (!open()) return
        if (hidden && readSecuritySettings().lockAfter === 'now')
            return session.lock()
        const left = await idleTime(local)
        if (left === null) return
        if (left === 0) session.lock()
        else timer.arm(left, () => void check())
    }

    async function onActivity() {
        const now = Date.now()
        const before = active
        active = now
        if (!open()) return
        // A deadline timer that lagged (a suspended page) must not let activity revive an expired session.
        if ((await idleTime(before)) === 0) return session.lock()
        if (now - stamped < STAMP_EVERY_MS) return
        stamped = now
        if (readSecuritySettings().lockAfter !== 'now') await writeActive(now)
    }

    function hide() {
        if (open() && readSecuritySettings().lockAfter === 'now') session.lock()
    }

    const failed = (error: unknown) => reportError(error, 'auto-lock')
    useEventListener(window, ACTIVITY, () => void onActivity().catch(failed), {
        passive: true,
    })
    useEventListener(document, 'visibilitychange', () => {
        if (document.visibilityState === 'hidden') hide()
        else void check().catch(failed)
    })
    useEventListener(window, 'pagehide', hide)
    // The popup or the app page changed the policy: the armed deadline is for the old one.
    useEventListener(window, 'storage', (event: StorageEvent) => {
        if (event.key === SECURITY_SETTINGS_STORAGE_KEY)
            void check().catch(failed)
    })

    // A restored page keeps the deadline it found, even one passed while it opened; an unlock finds no stamp (its lock
    // removed it) and starts one.
    async function opened() {
        active = (await readActive()) ?? Date.now()
    }

    watch(
        [() => session.state, () => policy.policy.lockAfter],
        ([state], previous) => {
            const opening = state === 'unlocked' && previous?.[0] !== state
            void (opening ? opened() : Promise.resolve())
                .then(() => check())
                .catch(failed)
        },
        { immediate: true },
    )

    return {
        /** Reads the policy and the shared stamp again and locks past the deadline (or, hidden, under Immediately);
         *  resolves once decided, so an answer that follows needs no timer to have fired. Rejects when it cannot
         *  read the stamp: the caller must not answer as if the session were alive. */
        check: () => check(),
        /** Counts as activity, as a pointer event does: the shared stamp moves at most every 15 s. */
        touch: () => onActivity().catch(failed),
    }
}

export type AutoLock = ReturnType<typeof useAutoLock>
