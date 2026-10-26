import type { AccountTag } from '../model'

/** The mockup's swatches: a tag's hue is picked, never derived from its name. */
export const TAG_HUES = [265, 205, 150, 95, 45, 25, 330] as const
export const MAX_TAG_LENGTH = 24

export type TagState = 'all' | 'some' | 'none'

export function tagLabel(text: string): string {
    return text.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH)
}

/** Labels are unique ignoring case: "Main" finds "main". */
export function findTag<T extends AccountTag>(
    tags: readonly T[],
    label: string,
): T | undefined {
    const key = tagLabel(label).toLowerCase()
    return tags.find((tag) => tag.label.toLowerCase() === key)
}

/** The first swatch no tag wears yet, so new tags tell apart. */
export function freeHue(tags: readonly AccountTag[]): number {
    const taken = new Set(tags.map((tag) => tag.hue))
    return (
        TAG_HUES.find((hue) => !taken.has(hue)) ??
        (TAG_HUES[tags.length % TAG_HUES.length] as number)
    )
}

/** How many of the picked accounts wear each tag, by tag id. */
export function tagCounts(
    accounts: readonly { tags: readonly AccountTag[] }[],
): Map<string, number> {
    const counts = new Map<string, number>()
    for (const { tags } of accounts)
        for (const { id } of tags) counts.set(id, (counts.get(id) ?? 0) + 1)
    return counts
}

export function stateOf(count: number, of: number): TagState {
    return count === 0 ? 'none' : count === of ? 'all' : 'some'
}

/** A mixed tag cycles to all, none, then back to as it was; the others flip. */
export function nextTagState(initial: TagState, current: TagState): TagState {
    if (initial === 'some')
        return ({ some: 'all', all: 'none', none: 'some' } as const)[current]
    return current === 'all' ? 'none' : 'all'
}

/** Ids to put on every picked account and to take off, from each changed tag's target state. */
export function tagChanges(
    initial: ReadonlyMap<string, TagState>,
    current: ReadonlyMap<string, TagState>,
): { add: string[]; remove: string[] } {
    const changed = [...current].filter(
        ([id, state]) => initial.get(id) !== state,
    )
    return {
        add: changed.flatMap(([id, state]) => (state === 'all' ? [id] : [])),
        remove: changed.flatMap(([id, state]) =>
            state === 'none' ? [id] : [],
        ),
    }
}
