interface Keyed {
    key?: string
    label: string
    description?: string
}

/** Gives every item a key unique in its group: its own, else label + description, plus a counter for repeats. */
export function keyItems<T extends Keyed>(items: T[]): T[] {
    const seen = new Map<string, number>()
    return items.map((item) => {
        const base = item.key ?? `${item.label}\0${item.description ?? ''}`
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)
        return { ...item, key: count === 0 ? base : `${base}\0${count}` }
    })
}
