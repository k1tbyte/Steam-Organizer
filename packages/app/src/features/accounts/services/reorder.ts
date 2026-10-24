import type { Account } from '../model'
import { type ListRow, rowHeight } from './listRows'

export type Group = 'pinned' | 'all'

/** `items` with those at `from` taken out and put back together, in their order, at `to` of the result. */
export function moveItems<T>(
    items: readonly T[],
    from: readonly number[],
    to: number,
): T[] {
    const picked = new Set(from)
    const next = items.filter((_, index) => !picked.has(index))
    next.splice(to, 0, ...items.filter((_, index) => picked.has(index)))
    return next
}

/** A move as the vault stores it: the moved ids, in order, between two neighbours (null past either end of the group). */
export interface Placement {
    ids: string[]
    after: string | null
    before: string | null
}

/** The moved block of `next` (`count` items at `to`) and the neighbours it landed between. */
export function placementIn(
    next: readonly Account[],
    to: number,
    count: number,
): Placement {
    return {
        ids: next.slice(to, to + count).map((account) => account.id),
        after: next[to - 1]?.id ?? null,
        before: next[to + count]?.id ?? null,
    }
}

/** `order` with the moved ids right after `after` (or before `before`); everything else keeps its place. */
export function placeBetween(
    order: readonly string[],
    { ids, after, before }: Placement,
): string[] {
    const moved = new Set(ids)
    const next = order.filter((id) => !moved.has(id))
    const anchor = after ?? before
    const at = anchor === null ? next.length : next.indexOf(anchor)
    next.splice(after === null ? at : at + 1, 0, ...ids)
    return next
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
    group: Group,
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

/** The group indices of the cards `rect` (list coordinates) touches; the gaps between them touch none. */
export function cardsIn(
    rect: { left: number; top: number; right: number; bottom: number },
    geometry: GroupGeometry,
): number[] {
    const { top, rowHeight, columns, cellWidth, gap, count } = geometry
    // Slots `origin + i * step`, each `size` long, that overlap [from, to].
    const span = (
        from: number,
        to: number,
        origin: number,
        step: number,
        size: number,
        slots: number,
    ): [number, number] => [
        Math.max(0, Math.ceil((from - origin - size) / step)),
        Math.min(slots - 1, Math.floor((to - origin) / step)),
    ]
    const [firstRow, lastRow] = span(
        rect.top,
        rect.bottom,
        top,
        rowHeight,
        rowHeight - gap,
        Math.ceil(count / columns),
    )
    const [firstColumn, lastColumn] = span(
        rect.left,
        rect.right,
        0,
        cellWidth + gap,
        cellWidth,
        columns,
    )
    const touched: number[] = []
    for (let row = firstRow; row <= lastRow; row++)
        for (let column = firstColumn; column <= lastColumn; column++) {
            const index = row * columns + column
            if (index < count) touched.push(index)
        }
    return touched
}
