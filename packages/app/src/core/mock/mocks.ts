import {
    type ComputedRef,
    computed,
    getCurrentScope,
    onScopeDispose,
    reactive,
    shallowReactive,
} from 'vue'

import { MOCKS_STORAGE_KEY, readStored, writeStored } from '../storage'

/** `live` shows only real data, `fill` samples what has no source yet, `mock` samples everything. */
export type MockMode = 'live' | 'fill' | 'mock'

export interface Mock<T> {
    key: string
    label: string
    /** Named samples; the first one is the default. */
    variants: Record<string, T>
}

// Design-first scaffolding: deleting core/mock makes typecheck list every consumer.
const state = reactive({
    enabled: false,
    mode: 'live' as MockMode,
    picks: {} as Record<string, string>,
})

/** Mocks read by mounted view-models, with reader count: the panel lists only these. */
const inUse = shallowReactive(new Map<Mock<unknown>, number>())

export function defineMock<T>(
    key: string,
    label: string,
    variants: Record<string, T>,
): Mock<T> {
    return { key, label, variants }
}

function track(mock: Mock<unknown>) {
    if (!getCurrentScope()) return
    inUse.set(mock, (inUse.get(mock) ?? 0) + 1)
    onScopeDispose(() => {
        const left = (inUse.get(mock) ?? 1) - 1
        if (left > 0) inUse.set(mock, left)
        else inUse.delete(mock)
    })
}

/** `real` gives `undefined` while there is no source for it; a wired read maps "nothing" to null. */
export function useMock<T>(
    real: () => T | undefined,
    mock: Mock<T>,
): ComputedRef<T | undefined> {
    track(mock)
    return computed(() => {
        const value = real()
        if (state.mode === 'live') return value
        if (state.mode === 'fill' && value !== undefined) return value
        return mock.variants[pickOf(mock)]
    })
}

function pickOf(mock: Mock<unknown>): string {
    const picked = state.picks[mock.key]
    return picked !== undefined && picked in mock.variants
        ? picked
        : (Object.keys(mock.variants)[0] ?? '')
}

export function startMocks(enabled: boolean) {
    state.enabled = enabled
    state.mode = enabled ? 'fill' : 'live'
    if (!enabled) return
    try {
        const stored = JSON.parse(readStored(MOCKS_STORAGE_KEY) ?? '{}')
        if (['live', 'fill', 'mock'].includes(stored.mode))
            state.mode = stored.mode
        if (stored.picks) state.picks = stored.picks
    } catch {}
}

/** The panel's view: mode and per-mock variant, persisted on change. */
export function useMockControls() {
    const save = () =>
        writeStored(
            MOCKS_STORAGE_KEY,
            JSON.stringify({ mode: state.mode, picks: state.picks }),
        )
    return {
        enabled: computed(() => state.enabled),
        mode: computed({
            get: () => state.mode,
            set: (mode: MockMode) => {
                state.mode = mode
                save()
            },
        }),
        mocks: computed(() =>
            [...inUse.keys()].sort((a, b) => a.key.localeCompare(b.key)),
        ),
        pickOf,
        pick(key: string, variant: string) {
            state.picks = { ...state.picks, [key]: variant }
            save()
        },
    }
}
