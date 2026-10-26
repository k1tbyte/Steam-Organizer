export interface MenuItem {
    /** Identity across renders; defaults to label + description, so rows sharing a label need a key or a description. A choice group's value names it. */
    key?: string
    label: string
    description?: string
    icon?: string
    color?: 'danger'
    disabled?: boolean
    /** Opens another overlay: runs once the menu has closed, which would otherwise hand focus back and dismiss it. */
    opens?: boolean
    onSelect?: () => void
}

export interface MenuGroup {
    label?: string
    /** The group is one choice, `value` the key of the chosen item: a trailing check, or a segmented track for a short pick. */
    choice?: 'list' | 'segmented'
    value?: string
    items: MenuItem[]
}

/** Runs a picked item. One that `opens` an overlay waits for the menu to close and hands focus back itself:
 *  reka does it a task later, pulling focus out of the overlay. */
export function menuSelection() {
    let pending: (() => void) | undefined
    return {
        select(item: MenuItem) {
            if (item.opens) pending = item.onSelect
            else item.onSelect?.()
        },
        closed(event: Event, trigger?: HTMLElement) {
            const run = pending
            pending = undefined
            if (!run) return
            event.preventDefault()
            trigger?.focus()
            run()
        },
    }
}

/** A flat list, or groups split by separators. */
export type MenuEntries = MenuItem[] | (MenuItem[] | MenuGroup)[]

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

export function menuGroups(entries: MenuEntries): MenuGroup[] {
    const first = entries[0]
    const flat = !first || !(Array.isArray(first) || 'items' in first)
    const groups = flat
        ? [{ items: entries as MenuItem[] }]
        : (entries as (MenuItem[] | MenuGroup)[]).map((group) =>
              Array.isArray(group) ? { items: group } : group,
          )
    return groups.map((group) => ({ ...group, items: keyItems(group.items) }))
}
