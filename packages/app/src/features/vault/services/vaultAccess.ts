import type { SessionState } from '../model'

const HOME: Record<SessionState, string> = {
    new: '/welcome',
    locked: '/unlock',
    unlocked: '/',
}

/** Where a session in `state` goes instead of a page open to `allowed`; undefined when it may stay. */
export function redirectFor(
    state: SessionState,
    allowed: readonly SessionState[] = ['unlocked'],
): string | undefined {
    return allowed.includes(state) ? undefined : HOME[state]
}
