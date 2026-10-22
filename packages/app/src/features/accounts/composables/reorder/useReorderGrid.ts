import { durationToken } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import { useEventListener } from '@vueuse/core'
import {
    computed,
    nextTick,
    onScopeDispose,
    type Ref,
    shallowRef,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { useScrollRoot, useScrollTop } from '#core'

import type { Account } from '../../model'
import { cornerInsetCss } from '../../services/cardLayout'
import { assignSlots } from '../../services/listSlots'
import { dropIndex, groupGeometry, moveItem } from '../../services/reorder'
import { useAccountRows } from '../useAccountRows'
import { useVaultAccounts } from '../useVaultAccounts'
import { useReorderDrag } from './useReorderDrag'

// Neighbours make room once the pointer rests over a slot this long, so a card passing over them leaves them still.
const DWELL_MS = 150

type Group = 'pinned' | 'all'
export interface ReorderCell {
    account: Account
    x: number
    y: number
    state: 'rest' | 'lifted' | 'landing'
    /** The render key: a node that held another account takes this one. */
    slot: number
    /** Not on screen last render: its node, if reused, must jump to its place, not slide. */
    entered: boolean
}
/** A move the grid shows before the vault holds it: a drag or arrow presses, then the landing. */
interface Move {
    id: string
    group: Group
    from: number
    to: number
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

/** The vault order as cards that keep their node while on screen: a dragged card follows the pointer while the rest make room at its slot; arrows on a focused card move it too.
 *  Cells keep the vault order in the DOM (tab order; a node Vue moves loses its transition and focus), so a move commits only once it has landed. */
export function useReorderGrid(list: Ref<HTMLElement | null>) {
    const { t } = useI18n()
    const vault = useVaultAccounts()
    const scroller = useScrollRoot()
    const scrollTop = useScrollTop()
    const pinned = computed(() => vault.accounts.value.filter((a) => a.pinned))
    const rest = computed(() => vault.accounts.value.filter((a) => !a.pinned))
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

    const drag = useReorderDrag(list, {
        start(id) {
            flush()
            move.value = begin(id)
        },
        end(dropped) {
            dwell.cancel()
            pending = null
            const current = move.value
            if (!current) return
            move.value = {
                ...current,
                to: dropped ? target(current) : current.from,
            }
            landing.arm(durationToken('--dur-slow'), flush)
        },
    })

    // The accounts changed under the move (a sync, a mock switch): its indices point at others now.
    const holds = (current: Move | null, group: Group): current is Move =>
        current?.group === group &&
        members(group)[current.from]?.id === current.id
    const preview = (group: Group) =>
        computed(() => {
            const current = move.value
            return holds(current, group)
                ? moveItem(members(group), current.from, current.to)
                : members(group)
        })
    const grid = useAccountRows(
        { pinned: preview('pinned'), rest: preview('all') },
        list,
    )
    const geometry = (group: Group) =>
        groupGeometry(grid.rows.value, group, grid.sizes.value, {
            ...grid.cell.value,
            count: members(group).length,
        })

    function begin(id: string): Move | null {
        for (const group of ['pinned', 'all'] as const) {
            const from = members(group).findIndex((a) => a.id === id)
            if (from >= 0) return { id, group, from, to: from }
        }
        return null
    }
    /** The slot under the pointer; off the group's cards, the card's own. */
    function target(current: Move): number {
        const point = drag.point.value
        return (
            (point && dropIndex(point, geometry(current.group))) ?? current.from
        )
    }

    function flush() {
        landing.cancel()
        const current = move.value
        move.value = null
        if (
            !current ||
            !holds(current, current.group) ||
            current.from === current.to
        )
            return
        const accounts = members(current.group)
        vault.reorderGroup(
            moveItem(accounts, current.from, current.to).map((a) => a.id),
        )
        announcement.value = t('{name}, position {position} of {count}', {
            name: accounts[current.from]?.nickname,
            position: current.to + 1,
            count: accounts.length,
        })
    }
    // Leaving the mode mid-drag drops nothing; a move already dropped or keyed still commits.
    onScopeDispose(() => {
        drag.cancel()
        flush()
    })

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
        const landingId = move.value?.id
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
                const state = account.id === landingId ? 'landing' : 'rest'
                cells.push({ account, x: column * (cellWidth + gap), y, state })
            }
        }
        // Kept inside the list: past its edges the card would grow the scroll area it drags in.
        const corner = drag.corner.value
        const account = lifted
            ? vault.accounts.value.find((a) => a.id === lifted)
            : undefined
        if (account && corner)
            cells.push({
                account,
                x: clamp(corner.x, (columns - 1) * (cellWidth + gap)),
                y: clamp(
                    corner.y,
                    grid.totalSize.value - grid.sizes.value.cardPx,
                ),
                state: 'lifted',
            })
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

    /** Arrows move the card by one, or by a row, within its group; presses add up until it lands. */
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
        if (move.value?.id !== id) flush()
        const current = move.value ?? begin(id)
        if (!current) return
        const to = clamp(current.to + step, members(current.group).length - 1)
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

    // Capture, so ReorderBar's Esc, which leaves the mode, sees it handled.
    useEventListener(
        window,
        'keydown',
        (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || !drag.dragging.value) return
            event.preventDefault()
            drag.cancel()
        },
        { capture: true },
    )

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
            drag.press(event, cell.account.id, cell, handle)
        },
        nudge,
        keyboard,
        focusIn,
        focusOut,
    }
}
