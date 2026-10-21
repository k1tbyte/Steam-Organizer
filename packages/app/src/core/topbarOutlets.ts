import { type ShallowRef, shallowRef } from 'vue'

export const TOPBAR_SLOTS = [
    'back',
    'title',
    'status',
    'center',
    'actions',
    'strip',
] as const
export type TopbarSlot = (typeof TOPBAR_SLOTS)[number]

type Outlet = ShallowRef<HTMLElement | null>

// The shell mounts one set of outlet elements; any page teleports its topbar parts into them.
const targets = {} as Record<TopbarSlot, Outlet>
// One stable function per slot: a fresh one per render would unset and reset the ref on every patch.
const bind = {} as Record<TopbarSlot, (el: unknown) => void>

for (const slot of TOPBAR_SLOTS) {
    const outlet: Outlet = shallowRef(null)
    targets[slot] = outlet
    bind[slot] = (el) => {
        outlet.value = el as HTMLElement | null
    }
}

export function useTopbarOutlets() {
    return { targets, bind }
}
