import { nextTick, type Ref, type ShallowRef, shallowRef, watch } from 'vue'

import type { Group } from '../../services/reorder'
import type { useAccountRows } from '../list/useAccountRows'

/** The part of a move the keys read. */
interface Keyed {
    id: string
    group: Group
    ids: string[]
    home: number
    to: number | null
}

/** Arrows on a focused card move it, and the focus follows the cards the grid draws. A move is the grid's: the keys only
 *  start or advance it and arm its landing. */
export function useReorderKeys<M extends Keyed>(
    list: Ref<HTMLElement | null>,
    {
        move,
        held,
        cells,
        grid,
        scroller,
        begin,
        holds,
        flush,
        land,
        members,
        geometry,
    }: {
        move: ShallowRef<M | null>
        held: Ref<boolean>
        cells: Ref<{ account: { id: string } }[]>
        grid: Pick<
            ReturnType<typeof useAccountRows>,
            'cell' | 'margin' | 'sizes'
        >
        scroller: Ref<HTMLElement | null | undefined>
        begin: (id: string, together: boolean) => M | null
        holds: (current: M | null, group: Group) => current is M
        flush: () => void
        land: () => void
        members: (group: Group) => unknown[]
        geometry: (group: Group) => {
            top: number
            columns: number
            rowHeight: number
        }
    },
) {
    // Keeps a card moved by keys on screen: its slot is arithmetic, the node may still be sliding.
    function reveal(group: Group, index: number) {
        const el = scroller.value
        if (!el) return
        const { top, columns, rowHeight } = geometry(group)
        const from =
            grid.margin.value + top + Math.floor(index / columns) * rowHeight
        const to = from + grid.sizes.value.cardPx
        if (from < el.scrollTop) el.scrollTop = from
        else if (to > el.scrollTop + el.clientHeight)
            el.scrollTop = to - el.clientHeight
    }

    /** Arrows move the card by one, or by a row, within its group; presses add up until it lands. A selection stays put. */
    function nudge(event: KeyboardEvent, id: string) {
        const { columns } = grid.cell.value
        const step = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -columns,
            ArrowDown: columns,
        }[event.key]
        if (step === undefined || held.value) return
        event.preventDefault()
        const own = move.value
        if (own?.id !== id || own.ids.length > 1 || !holds(own, own.group))
            flush()
        const current = move.value ?? begin(id, false)
        if (!current) return
        const to = Math.min(
            members(current.group).length - 1,
            Math.max(0, (current.to ?? current.home) + step),
        )
        if (to === current.to) return
        move.value = { ...current, to }
        land()
        reveal(current.group, to)
    }

    // Cards go inert, out of Tab, only while the keyboard is in the grid: inert content costs Chrome a compositor layer per card part.
    const keyboard = shallowRef(false)
    function focusIn(event: FocusEvent) {
        const cell = event.currentTarget as HTMLElement
        const target = event.target as HTMLElement
        keyboard.value = target.matches(':focus-visible')
        // Shift+Tab from below lands on a card's own control: the cell is the card's one stop.
        if (keyboard.value && target !== cell) cell.focus()
    }
    function focusOut(event: FocusEvent) {
        if (!list.value?.contains(event.relatedTarget as Node | null))
            keyboard.value = false
    }
    // Vue moves nodes on a commit or a long scroll, which drops their focus: the focused account gets it back while on screen.
    // One that left is blurred first: its node is about to show another account.
    watch(cells, (shown) => {
        const active = document.activeElement
        if (!(active instanceof HTMLElement) || !list.value?.contains(active))
            return
        const id = active.closest<HTMLElement>('[data-id]')?.dataset.id
        if (!id || !shown.some((cell) => cell.account.id === id))
            return active.blur()
        nextTick(() => {
            if (!list.value?.contains(document.activeElement))
                list.value
                    ?.querySelector<HTMLElement>(
                        `[data-id="${CSS.escape(id)}"]`,
                    )
                    ?.focus({ preventScroll: true })
        })
    })

    return { nudge, keyboard, focusIn, focusOut }
}
