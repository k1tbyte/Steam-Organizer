import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { installSessionArea, sessionArea } from '#core'

import { readActive, readKept, writeActive } from '../services/device/keptEntry'
import { freshDevice, page } from '../testing/sessionPages'
import { useAutoLock } from './useAutoLock'

const PASSWORD = 'correct horse'
const SECOND = 1000
let scope = effectScope()

// A page that has been open since the app page made its session, with no event of its own.
async function restoredPage(lockAfter: '1m' | '15m' = '1m') {
    const app = await page()
    await app.policy.setLockAfter(lockAfter)
    await app.session.create('Main', PASSWORD)
    await vi.waitFor(async () => expect(await readKept()).toBeDefined())
    const host = await page()
    expect(host.session.state).toBe('unlocked')
    return { app, host }
}

const lockOf = (hidden: boolean) =>
    scope.run(() => useAutoLock({ hidden })) as ReturnType<typeof useAutoLock>

beforeEach(async () => {
    scope = effectScope()
    // Only the clock: no deadline timer fires, so a lock comes from `check()` alone.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.stubGlobal('window', new EventTarget())
    vi.stubGlobal(
        'document',
        Object.assign(new EventTarget(), { visibilityState: 'visible' }),
    )
    await freshDevice()
})

afterEach(() => {
    scope.stop()
    vi.useRealTimers()
    vi.unstubAllGlobals()
})

it('locks a page past the shared deadline when it checks, with no timer fired', async () => {
    const { host } = await restoredPage('1m')
    const autoLock = lockOf(true)
    await autoLock.check()
    expect(host.session.state).toBe('unlocked')

    vi.advanceTimersByTime(61 * SECOND)
    await autoLock.check()
    expect(host.session.state).toBe('locked')
})

it('follows the activity another page stamped', async () => {
    const { host } = await restoredPage('1m')
    const autoLock = lockOf(true)
    vi.advanceTimersByTime(50 * SECOND)
    await writeActive(Date.now())
    vi.advanceTimersByTime(40 * SECOND)
    await autoLock.check()
    expect(host.session.state).toBe('unlocked')
})

it('holds a never-visible page locked under Immediately, also when the policy switched meanwhile', async () => {
    const { app, host } = await restoredPage('15m')
    const autoLock = lockOf(true)
    await autoLock.check()
    expect(host.session.state).toBe('unlocked')

    await app.policy.setLockAfter('now')
    await autoLock.check()
    expect(host.session.state).toBe('locked')
})

it('leaves a page that is not hidden alone under Immediately', async () => {
    const { app, host } = await restoredPage('15m')
    const autoLock = lockOf(false)
    await app.policy.setLockAfter('now')
    await autoLock.check()
    expect(host.session.state).toBe('unlocked')
})

it('stamps activity at most every 15 s, as a pointer event does', async () => {
    await restoredPage('15m')
    const autoLock = lockOf(true)
    const first = Date.now()
    await autoLock.touch()
    expect(await readActive()).toBe(first)

    vi.advanceTimersByTime(5 * SECOND)
    await autoLock.touch()
    expect(await readActive()).toBe(first)

    vi.advanceTimersByTime(11 * SECOND)
    await autoLock.touch()
    expect(await readActive()).toBe(Date.now())
})

it('does not let a touch revive a session past its deadline', async () => {
    const { host } = await restoredPage('1m')
    const autoLock = lockOf(true)
    vi.advanceTimersByTime(61 * SECOND)
    await autoLock.touch()
    expect(host.session.state).toBe('locked')
})

it('rejects when it cannot read the shared stamp, so no answer follows as if the session were alive', async () => {
    const { host } = await restoredPage('1m')
    const autoLock = lockOf(true)
    installSessionArea({
        ...sessionArea(),
        get: async () => {
            throw new Error('relay down')
        },
    })
    await expect(autoLock.check()).rejects.toThrow('relay down')
    // Not decided: the page is neither locked nor vouched for.
    expect(host.session.state).toBe('unlocked')
})
