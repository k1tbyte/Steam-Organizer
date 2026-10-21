import { describe, expect, test } from 'vitest'

import { createDockScroll } from './dockScroll'

function scrollThrough(
    dock: ReturnType<typeof createDockScroll>,
    offsets: number[],
) {
    return offsets.map((y) => dock.scroll(y))
}

describe('dock scroll', () => {
    test('hides after more than 24px of downward travel', () => {
        const dock = createDockScroll()
        dock.reset(40)
        expect(scrollThrough(dock, [60, 64, 65])).toEqual([false, false, true])
    })

    test('shows after more than 24px back up', () => {
        const dock = createDockScroll()
        dock.reset(100)
        scrollThrough(dock, [200])
        expect(scrollThrough(dock, [190, 176, 174])).toEqual([
            true,
            true,
            false,
        ])
    })

    test('a change of direction starts the travel over', () => {
        const dock = createDockScroll()
        dock.reset(100)
        expect(scrollThrough(dock, [120, 110, 130])).toEqual([
            false,
            false,
            false,
        ])
    })

    test('stays shown near the top and clears the travel', () => {
        const dock = createDockScroll()
        dock.reset(100)
        scrollThrough(dock, [200])
        expect(dock.scroll(5)).toBe(false)
        expect(scrollThrough(dock, [20, 28])).toEqual([false, false])
    })

    test('reset adopts a restored offset instead of counting it as a scroll', () => {
        const dock = createDockScroll()
        dock.reset(2000)
        expect(dock.scroll(2000)).toBe(false)
        expect(dock.scroll(2010)).toBe(false)
    })
})
