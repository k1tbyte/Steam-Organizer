import type { Account } from '../model'
import { type ListRow, rowHeight } from './listRows'

/** `items` with the one at `from` moved to `to`. */
export function moveItem<T>(
    items: readonly T[],
    from: number,
    to: number,
): T[] {
    const next = [...items]
    next.splice(to, 0, ...next.splice(from, 1))
    return next
}

/** The vault order with `group`'s members in `group`'s order, in the places they held: pinned and the rest interleave in the vault, and the other group stays put. */
export function withGroupOrder(
    order: readonly string[],
    group: readonly string[],
): string[] {
    const members = new Set(group)
    let next = 0
    return order.map((id) => (members.has(id) ? (group[next++] ?? id) : id))
}

/** `accounts` in `order`; an id the order lacks keeps its place after the ordered ones. */
export function applyOrder(
    accounts: readonly Account[],
    order: readonly string[],
): Account[] {
    const rank = new Map(order.map((id, index) => [id, index]))
    return [...accounts].sort(
        (a, b) =>
            (rank.get(a.id) ?? order.length) - (rank.get(b.id) ?? order.length),
    )
}

export interface GroupGeometry {
    /** The group's first card row, in list coordinates. */
    top: number
    rowHeight: number
    columns: number
    cellWidth: number
    gap: number
    count: number
}

/** Where a group's cards sit: its rows are contiguous and of one height, so a point maps to an index by arithmetic. */
export function groupGeometry(
    rows: readonly ListRow[],
    group: 'pinned' | 'all',
    sizes: { unit: number; gapUnits: number; cardPx: number },
    grid: { columns: number; cellWidth: number; count: number },
): GroupGeometry {
    const heading = rows.findIndex(
        (row) => row.kind === 'heading' && row.key === group,
    )
    let top = 0
    for (let index = 0; index <= heading; index++) {
        const row = rows[index]
        if (row) top += rowHeight(row, sizes)
    }
    return {
        top,
        rowHeight: sizes.cardPx + sizes.gapUnits * sizes.unit,
        gap: sizes.gapUnits * sizes.unit,
        ...grid,
    }
}

/** The group index under `point` (list coordinates); null off the group's cards: above it, beside it, past its last card. */
export function dropIndex(
    point: { x: number; y: number },
    geometry: GroupGeometry,
): number | null {
    const { top, rowHeight, columns, cellWidth, gap, count } = geometry
    if (
        point.y < top ||
        point.x < 0 ||
        point.x > columns * (cellWidth + gap) - gap
    )
        return null
    const index =
        Math.floor((point.y - top) / rowHeight) * columns +
        Math.floor((point.x + gap / 2) / (cellWidth + gap))
    return index < count ? index : null
}
