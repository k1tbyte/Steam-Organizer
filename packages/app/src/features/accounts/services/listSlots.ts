/** Keeps every row still in range in its slot and gives rows that came in the slots of rows that left:
 *  a slot is the render key, so scrolling patches a row's nodes with new accounts instead of remounting them. */
export function assignSlots(
    previous: ReadonlyMap<string, number>,
    keys: readonly string[],
): Map<string, number> {
    const next = new Map<string, number>()
    for (const key of keys) {
        const slot = previous.get(key)
        if (slot !== undefined) next.set(key, slot)
    }
    const taken = new Set(next.values())
    const free = [...previous.values()]
        .filter((slot) => !taken.has(slot))
        .sort((a, b) => a - b)
    let fresh = 0
    for (const key of keys) {
        if (next.has(key)) continue
        let slot = free.shift()
        if (slot === undefined) {
            while (taken.has(fresh)) fresh++
            slot = fresh
        }
        taken.add(slot)
        next.set(key, slot)
    }
    return next
}
