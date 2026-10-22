import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import { useHold } from './useHold'

const press = { button: 0 } as PointerEvent

function setup(options: Parameters<typeof useHold>[0]) {
    const scope = effectScope()
    const hold = scope.run(() => useHold(options))
    if (!hold) throw new Error('scope did not run')
    return { ...hold, scope }
}

describe('useHold', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('reveals while pressed and hides on release', () => {
        const { holding, handlers } = setup({})
        handlers.onPointerdown(press)
        expect(holding.value).toBe(true)
        handlers.onPointerup()
        expect(holding.value).toBe(false)
    })

    it('completes only after the full duration', () => {
        const onComplete = vi.fn()
        const { holding, handlers } = setup({ duration: 1000, onComplete })
        handlers.onPointerdown(press)
        vi.advanceTimersByTime(999)
        expect(onComplete).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1)
        expect(onComplete).toHaveBeenCalledOnce()
        expect(holding.value).toBe(false)
    })

    it('cancels when released early', () => {
        const onComplete = vi.fn()
        const { handlers } = setup({ duration: 1000, onComplete })
        handlers.onPointerdown(press)
        vi.advanceTimersByTime(500)
        handlers.onPointerleave()
        vi.advanceTimersByTime(1000)
        expect(onComplete).not.toHaveBeenCalled()
    })

    it('holds on Space and ignores key repeat', () => {
        const onComplete = vi.fn()
        const { holding, handlers } = setup({ duration: 1000, onComplete })
        const key = (repeat: boolean) =>
            ({ key: ' ', repeat, preventDefault: () => {} }) as KeyboardEvent
        handlers.onKeydown(key(false))
        vi.advanceTimersByTime(600)
        handlers.onKeydown(key(true))
        vi.advanceTimersByTime(400)
        expect(onComplete).toHaveBeenCalledOnce()
        expect(holding.value).toBe(false)
    })

    it('does nothing while disabled', () => {
        const { holding, handlers } = setup({ disabled: true })
        handlers.onPointerdown(press)
        expect(holding.value).toBe(false)
    })

    it('does not confirm when disabled during the hold', () => {
        const disabled = ref(false)
        const onComplete = vi.fn()
        const { handlers } = setup({ duration: 1000, onComplete, disabled })
        handlers.onPointerdown(press)
        disabled.value = true
        vi.advanceTimersByTime(1000)
        expect(onComplete).not.toHaveBeenCalled()
    })

    it('starts a panning touch late, so a swipe never shows it', () => {
        const touch = { button: 0, pointerType: 'touch' } as PointerEvent
        const { holding, handlers } = setup({ pans: true })
        handlers.onPointerdown(touch)
        expect(holding.value).toBe(false)
        handlers.onPointercancel()
        vi.advanceTimersByTime(1000)
        expect(holding.value).toBe(false)
        handlers.onPointerdown(touch)
        vi.advanceTimersByTime(100)
        expect(holding.value).toBe(true)
        handlers.onPointerdown(press)
        expect(holding.value).toBe(true)
    })

    it('stops when its scope ends', () => {
        const onComplete = vi.fn()
        const { handlers, scope } = setup({ duration: 1000, onComplete })
        handlers.onPointerdown(press)
        scope.stop()
        vi.advanceTimersByTime(1000)
        expect(onComplete).not.toHaveBeenCalled()
    })

    it('blocks the context menu only while a hold runs', () => {
        const { handlers } = setup({})
        const menu = () => {
            const event = { preventDefault: vi.fn() }
            handlers.onContextmenu(event as unknown as Event)
            return event.preventDefault
        }
        expect(menu()).not.toHaveBeenCalled()
        handlers.onPointerdown(press)
        expect(menu()).toHaveBeenCalledOnce()
    })
})
