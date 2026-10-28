import { durationToken } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import {
    computed,
    nextTick,
    onScopeDispose,
    type Ref,
    shallowRef,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { assignSlots, useScrollRoot, useScrollTop } from '#core'

import type { Account } from '../../model'
import { cornerInsetCss } from '../../services/cardLayout'
import {
    dropIndex,
    type Group,
    groupGeometry,
    moveItems,
    placementIn,
} from '../../services/reorder'
import { useAccountRows } from '../list/useAccountRows'
import { useVaultAccounts } from '../useVaultAccounts'
import { useEditSelection } from './useEditSelection'
import { useListDrag } from './useListDrag'
import { useMarquee } from './useMarquee'

// Neighbours make room once the pointer rests over a slot this long, so a card passing over them leaves them still.
const DWELL_MS = 150
// Cards drawn behind a lifted stack: more would read as a pile, not one card.
const STACK_PLATES = 2

export interface ReorderCell {
    account: Account
    x: number
    y: number
    state: 'rest' | 'lifted' | 'gathering' | 'landing'
    picked: boolean
    /** A lifted card carrying others: their count and the plates drawn behind it. */
    stack?: { count: number; plates: number }
    /** The render key: a node that held another account takes this one. */
    slot: number
    /** Not on screen last render: its node, if reused, must jump to its place, not slide. */
    entered: boolean
}
/** A move the grid shows before the vault holds it: a drag or arrow presses, then the landing. */
interface Move {
    /** The card the pointer or the keys hold. */
    id: string
    group: Group
    /** The group as the move found it: its indices point into this list only. */
    source: Account[]
    /** The cards that move, in group order, and their indices. */
    ids: string[]
    from: number[]
    /** The held card's slot while its stack takes one slot for all. */
    home: number
    /** Where the moved cards start; null puts every card back. */
    to: number | null
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

/** The groups in the vault order as cards that keep their node while on screen: a dragged card follows the pointer while the rest make room at its slot; arrows on a focused card move it too.
 *  A filtered group moves its shown cards among their own places; the hidden ones stay put.
 *  Cells keep the vault order in the DOM (tab order; a node Vue moves loses its transition and focus), so a move commits only once it has landed. */
export function useReorderGrid(
    { pinned, rest }: { pinned: Ref<Account[]>; rest: Ref<Account[]> },
    list: Ref<HTMLElement | null>,
) {
    const { t } = useI18n()
    const vault = useVaultAccounts()
    const selection = useEditSelection()
    const scroller = useScrollRoot()
    const scrollTop = useScrollTop()
    const members = (group: Group) =>
        group === 'pinned' ? pinned.value : rest.value
    const rank = computed(
        () =>
            new Map(
                [...pinned.value, ...rest.value].map((a, index) => [
                    a.id,
                    index,
                ]),
            ),
    )

    const move = shallowRef<Move | null>(null)
    const announcement = shallowRef('')
    const landing = useTimer()
    const dwell = useTimer()
    let pending: number | null = null
    // A click that ends a drag picks nothing.
    let dragged = false

    const drag = useListDrag(list, {
        start(id) {
            dragged = true
            flush()
            move.value = begin(id, true)
        },
        end(dropped) {
            dwell.cancel()
            pending = null
            const current = move.value
            if (!current) return
            const point = drag.point.value
            move.value = {
                ...current,
                to:
                    dropped && point
                        ? dropIndex(point, geometry(current.group))
                        : null,
            }
            landing.arm(durationToken('--dur-slow'), flush)
        },
    })

    // A filter, a sync or a mock switch changed the group under the move: it drops, its indices point at others now.
    const holds = (current: Move | null, group: Group): current is Move =>
        current?.group === group && current.source === members(group)
    const preview = (group: Group) =>
        computed(() => {
            const current = move.value
            if (!holds(current, group) || current.to === null)
                return members(group)
            if (current.id !== drag.dragging.value)
                return moveItems(members(group), current.from, current.to)
            // While held, the others wait in its stack, which takes one slot.
            const others = new Set(
                current.ids.filter((id) => id !== current.id),
            )
            return moveItems(
                members(group).filter((a) => !others.has(a.id)),
                [current.home],
                current.to,
            )
        })
    const previews = { pinned: preview('pinned'), all: preview('all') }
    const grid = useAccountRows(
        { pinned: previews.pinned, rest: previews.all },
        list,
    )
    const geometry = (group: Group) =>
        groupGeometry(grid.rows.value, group, grid.sizes.value, {
            ...grid.cell.value,
            count: previews[group].value.length,
        })

    /** `together`: a picked card brings the picks of its group. */
    function begin(id: string, together: boolean): Move | null {
        const picked = selection.ids.value
        const withPicked = together && picked.has(id)
        for (const group of ['pinned', 'all'] as const) {
            const source = members(group)
            const from: number[] = []
            const ids: string[] = []
            for (const [index, account] of source.entries())
                if (
                    account.id === id ||
                    (withPicked && picked.has(account.id))
                ) {
                    from.push(index)
                    ids.push(account.id)
                }
            const lead = ids.indexOf(id)
            if (lead < 0) continue
            // A stack of the whole group, or all of it but one card, moves nothing the held card alone couldn't.
            if (from.length > 1 && from.length >= source.length - 1)
                return begin(id, false)
            const home = (from[lead] ?? 0) - lead
            return { id, group, source, ids, from, home, to: home }
        }
        return null
    }
    /** The slot under the pointer; off the group's cards, the card's own. */
    function target(current: Move): number {
        const point = drag.point.value
        return (
            (point && dropIndex(point, geometry(current.group))) ?? current.home
        )
    }

    function flush() {
        landing.cancel()
        const current = move.value
        move.value = null
        if (!current || current.to === null || !holds(current, current.group))
            return
        const accounts = members(current.group)
        const count = current.from.length
        // A stack dropped on the last cards lands where it fits.
        const to = Math.min(current.to, accounts.length - count)
        const next = moveItems(accounts, current.from, to)
        if (next.every((account, index) => account === accounts[index])) return
        vault.move(placementIn(next, to, count))
        const at = { position: to + 1, count: accounts.length }
        announcement.value =
            current.ids.length > 1
                ? t('{moved} accounts, position {position} of {count}', {
                      moved: current.ids.length,
                      ...at,
                  })
                : t('{name}, position {position} of {count}', {
                      name: next[to]?.nickname,
                      ...at,
                  })
    }
    // Leaving the mode mid-drag drops nothing; a move already dropped or keyed still commits.
    onScopeDispose(() => {
        drag.cancel()
        flush()
        selection.show([])
    })
    watch(
        [pinned, rest],
        ([shownPinned, shownRest]) =>
            selection.show([...shownPinned, ...shownRest]),
        { immediate: true },
    )

    function settle() {
        const current = move.value
        if (current && pending !== null && current.id === drag.dragging.value)
            move.value = { ...current, to: pending }
        pending = null
    }
    watch(drag.point, () => {
        const current = move.value
        if (!current || current.id !== drag.dragging.value) return
        const to = target(current)
        if (to === current.to) {
            pending = null
            dwell.cancel()
        } else if (to !== pending) {
            pending = to
            dwell.arm(DWELL_MS, settle)
        }
    })
    // A scrolling list holds the change until it stops.
    watch(scrollTop, () => {
        if (pending !== null) dwell.arm(DWELL_MS, settle)
    })

    // Cells take the nodes of cells that left, like AccountsGrid's rows; each render carries the last assignment forward.
    let slots = new Map<string, number>()
    const view = computed(() => {
        const { columns, cellWidth, gap } = grid.cell.value
        const current = move.value
        const moving = new Set(current?.ids)
        const picked = selection.ids.value
        const lifted = drag.dragging.value
        const cells: Omit<ReorderCell, 'slot' | 'entered'>[] = []
        const headings: { group: Group; y: number; spaced: boolean }[] = []
        for (const item of grid.items.value) {
            const y = item.start - grid.margin.value
            if (item.row.kind === 'heading') {
                headings.push({
                    group: item.row.key,
                    y,
                    spaced: item.row.spaced,
                })
                continue
            }
            for (const [column, account] of item.row.accounts.entries()) {
                if (account.id === lifted) continue
                cells.push({
                    account,
                    x: column * (cellWidth + gap),
                    y,
                    state: moving.has(account.id) ? 'landing' : 'rest',
                    picked: picked.has(account.id),
                })
            }
        }
        const corner = drag.corner.value
        const account = lifted
            ? vault.accounts.value.find((a) => a.id === lifted)
            : undefined
        if (account && corner) {
            // Kept inside the list: past its edges the card would grow the scroll area it drags in.
            const at = {
                x: clamp(corner.x, (columns - 1) * (cellWidth + gap)),
                y: clamp(
                    corner.y,
                    grid.totalSize.value - grid.sizes.value.cardPx,
                ),
            }
            const count = moving.size
            cells.push({
                account,
                ...at,
                state: 'lifted',
                picked: picked.has(account.id),
                stack:
                    count > 1
                        ? { count, plates: Math.min(count - 1, STACK_PLATES) }
                        : undefined,
            })
            // Picked cards on screen fly into the stack; the rest of it is only counted.
            if (current && holds(current, current.group))
                for (const index of current.from) {
                    const other = members(current.group)[index]
                    if (other && other.id !== lifted && slots.has(other.id))
                        cells.push({
                            account: other,
                            ...at,
                            state: 'gathering',
                            picked: true,
                        })
                }
        }
        cells.sort(
            (a, b) =>
                (rank.value.get(a.account.id) ?? 0) -
                (rank.value.get(b.account.id) ?? 0),
        )
        const previous = slots
        slots = assignSlots(
            previous,
            cells.map((cell) => cell.account.id),
        )
        return {
            cells: cells.map((cell) => ({
                ...cell,
                slot: slots.get(cell.account.id) ?? 0,
                entered: !previous.has(cell.account.id),
            })),
            headings,
        }
    })

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
        if (step === undefined || drag.held.value) return
        event.preventDefault()
        const own = move.value
        if (own?.id !== id || own.ids.length > 1 || !holds(own, own.group))
            flush()
        const current = move.value ?? begin(id, false)
        if (!current) return
        const to = clamp(
            (current.to ?? current.home) + step,
            members(current.group).length - 1,
        )
        if (to === current.to) return
        move.value = { ...current, to }
        landing.arm(durationToken('--dur-slow'), flush)
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
    watch(view, ({ cells }) => {
        const active = document.activeElement
        if (!(active instanceof HTMLElement) || !list.value?.contains(active))
            return
        const id = active.closest<HTMLElement>('[data-id]')?.dataset.id
        if (!id || !cells.some((cell) => cell.account.id === id))
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

    const marquee = useMarquee(list, {
        geometry,
        shown: (group) => previews[group].value,
        bounds: () => {
            const { columns, cellWidth, gap } = grid.cell.value
            return {
                width: columns * (cellWidth + gap) - gap,
                height: grid.totalSize.value,
            }
        },
    })

    return {
        flags: grid.flags,
        touch: grid.touch,
        cardWidth: computed(() => `${grid.cell.value.cellWidth}px`),
        cornerInset: computed(() => cornerInsetCss(grid.touch.value)),
        totalSize: grid.totalSize,
        cells: computed(() => view.value.cells),
        headings: computed(() => view.value.headings),
        announcement,
        /** A press on a card or (`handle`) its handle. */
        press(event: PointerEvent, cell: ReorderCell, handle: boolean) {
            // The grip's press bubbles to the card's: the second must not reset a drag the first lifted.
            if (!drag.held.value) dragged = false
            drag.press(event, cell.account.id, cell, handle)
        },
        /** A click or Space toggles the card; with Shift, picks the range from the last one. */
        pick(event: MouseEvent | KeyboardEvent, account: Account) {
            if (drag.held.value || (event instanceof MouseEvent && dragged))
                return
            // A range follows the order on screen, which a landing move may not have committed yet.
            selection.toggle(
                account.id,
                [...previews.pinned.value, ...previews.all.value],
                event.shiftKey,
            )
        },
        marquee,
        nudge,
        keyboard,
        focusIn,
        focusOut,
    }
}
