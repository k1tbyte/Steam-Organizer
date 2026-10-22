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
}
/** A move the grid shows before the vault holds it: a drag or arrow presses, then the landing. */
interface Move {
    id: string
    group: Group
    from: number
    to: number
}

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

/** The vault order as cards keyed by account: a dragged card follows the pointer while the rest make room at its slot; arrows on a card's handle move it too.
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
        () => new Map(vault.accounts.value.map((a, index) => [a.id, index])),
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

    const preview = (group: Group) =>
        computed(() => {
            const current = move.value
            return current?.group === group
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
        const accounts = current ? members(current.group) : []
        const account = current && accounts[current.from]
        if (!current || !account || current.from === current.to) return
        const focused = document.activeElement
        vault.reorderGroup(
            moveItem(accounts, current.from, current.to).map((a) => a.id),
        )
        if (focused instanceof HTMLElement && list.value?.contains(focused))
            nextTick(
                () =>
                    focused.isConnected &&
                    focused.focus({ preventScroll: true }),
            )
        announcement.value = t('{name}, position {position} of {count}', {
            name: account.nickname,
            position: current.to + 1,
            count: accounts.length,
        })
    }
    onScopeDispose(flush)

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

    const view = computed(() => {
        const { columns, cellWidth, gap } = grid.cell.value
        const landingId = move.value?.id
        const lifted = drag.dragging.value
        const cells: ReorderCell[] = []
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
        return { cells, headings }
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
    }
}
