import type { Account } from '../model'
import { CARD_MIN_WIDTH_PX } from './cardLayout'

export type ListRow =
    | { kind: 'heading'; key: 'pinned' | 'all'; spaced: boolean }
    | { kind: 'cards'; key: string; accounts: Account[] }

// A heading is a fixed-height line, so rows never need measuring.
const HEADING_PX = 16

/** Columns that fit `width`: the grid's `auto-fill` rule, so the rows chunk like the mockup's CSS grid. */
export function columnsFor(width: number, gap: number): number {
    return Math.max(1, Math.floor((width + gap) / (CARD_MIN_WIDTH_PX + gap)))
}

function chunk(accounts: Account[], columns: number): ListRow[] {
    const rows: ListRow[] = []
    for (let i = 0; i < accounts.length; i += columns) {
        const part = accounts.slice(i, i + columns)
        rows.push({
            kind: 'cards',
            key: `cards:${part[0]?.id}`,
            accounts: part,
        })
    }
    return rows
}

/** The pinned group, then the rest, each as a heading and rows of `columns` cards; an empty group has neither. */
export function buildRows(
    pinned: Account[],
    rest: Account[],
    columns: number,
): ListRow[] {
    return [
        ...(pinned.length > 0
            ? [
                  { kind: 'heading', key: 'pinned', spaced: false } as const,
                  ...chunk(pinned, columns),
              ]
            : []),
        ...(rest.length > 0
            ? [
                  {
                      kind: 'heading',
                      key: 'all',
                      spaced: pinned.length > 0,
                  } as const,
                  ...chunk(rest, columns),
              ]
            : []),
    ]
}

/** Height in px including the gap below, in density `unit`s of `gapUnits`; `cardPx` is one card. */
export function rowHeight(
    row: ListRow,
    {
        unit,
        gapUnits,
        cardPx,
    }: { unit: number; gapUnits: number; cardPx: number },
): number {
    const gap = gapUnits * unit
    if (row.kind === 'cards') return cardPx + gap
    return HEADING_PX + gap + (row.spaced ? 2 * unit : 0)
}
