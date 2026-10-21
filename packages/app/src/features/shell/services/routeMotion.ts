export type RouteMotionKind =
    | 'slide-y'
    | 'slide-x'
    | 'shift-y'
    | 'shift-x'
    | 'drill'
    | 'hero'

/** `dir` 1 moves forward: down the rail, right along the tab bar, deeper into a section. */
export interface RouteMotion {
    kind: RouteMotionKind
    dir: 1 | -1
}

export interface RoutePlace {
    path: string
    nav?: string
    hero?: boolean
}

export interface RouteMotionContext {
    /** Section keys in rail and tab bar order. */
    order: readonly string[]
    desktop: boolean
    /** Flat surfaces slide whole pages; Subtle and Glass shift them a little and fade. */
    flat: boolean
    /** The browser can run the shared-element transition a hero page needs. */
    morph: boolean
}

const depth = (path: string) => path.split('/').filter(Boolean).length

/** A deeper or shallower page of one section drills (a hero page morphs on desktop); another section slides or shifts along the nav axis. */
export function pickRouteMotion(
    to: RoutePlace,
    from: RoutePlace,
    { order, desktop, flat, morph }: RouteMotionContext,
): RouteMotion | null {
    if (to.nav !== undefined && to.nav === from.nav) {
        const delta = depth(to.path) - depth(from.path)
        if (delta === 0) return null
        const dir = delta > 0 ? 1 : -1
        if (!desktop || !(to.hero || from.hero)) return { kind: 'drill', dir }
        return morph ? { kind: 'hero', dir } : null
    }
    const dir =
        order.indexOf(to.nav ?? '') >= order.indexOf(from.nav ?? '') ? 1 : -1
    const axis = desktop ? 'y' : 'x'
    return { kind: `${flat ? 'slide' : 'shift'}-${axis}`, dir }
}
