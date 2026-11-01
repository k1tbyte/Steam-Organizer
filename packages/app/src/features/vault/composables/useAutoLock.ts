import { useTimer } from '@so/ui/useTimer'
import { useEventListener } from '@vueuse/core'
import { watch } from 'vue'

import { readActive, writeActive } from '../services/keptEntry'
import { readSecuritySettings, timeoutMs } from '../services/lockPolicy'
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

/** Locks the page by the lock policy: after the idle time every page of the browser shares, and for Immediately when
 *  it is hidden. Watches only this page; the session locks and restores across pages. Call once per page. */
export function useAutoLock() {
    const session = useVaultSession()
    const policy = useLockPolicy()
    const timer = useTimer()
    // This page's own latest activity: the shared stamp lags it by up to the write interval.
    let active = Date.now()
    let stamped = 0

    async function check() {
        timer.cancel()
        if (session.state !== 'unlocked') return
        const limit = timeoutMs(readSecuritySettings().lockAfter)
        if (limit === null) return
        // Another page may have been used since: its stamp moves the deadline.
        const last = Math.max((await readActive()) ?? 0, active)
        const left = last + limit - Date.now()
        if (left <= 0) session.lock()
        else timer.arm(left, () => void check())
    }

    function onActivity() {
        const now = Date.now()
        active = now
        if (now - stamped < STAMP_EVERY_MS || session.state !== 'unlocked')
            return
        stamped = now
        if (timeoutMs(readSecuritySettings().lockAfter) !== null)
            void writeActive(now)
    }

    function hide() {
        if (
            session.state === 'unlocked' &&
            readSecuritySettings().lockAfter === 'now'
        )
            session.lock()
    }

    useEventListener(window, ACTIVITY, onActivity, { passive: true })
    useEventListener(document, 'visibilitychange', () => {
        if (document.visibilityState === 'hidden') hide()
        else void check()
    })
    useEventListener(window, 'pagehide', hide)
    watch(
        [() => session.state, () => policy.policy.lockAfter],
        ([state]) => {
            if (state === 'unlocked') active = Date.now()
            void check()
        },
        { immediate: true },
    )
}
