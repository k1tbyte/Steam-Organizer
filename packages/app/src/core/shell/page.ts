import {
    hasInjectionContext,
    type InjectionKey,
    inject,
    provide,
    type Ref,
    type ShallowRef,
    shallowRef,
} from 'vue'

export interface PageContext {
    /** Pages scroll inside the shell, each in its own container, not the window. */
    scroller: Readonly<ShallowRef<HTMLElement | null>>
    /** The scroller's offset, read once per scroll for every reader, before the page re-renders. */
    top: Readonly<Ref<number>>
    /** False while the page stays mounted behind the current one, or is leaving. */
    active: Readonly<Ref<boolean>>
}

const pageKey: InjectionKey<PageContext> = Symbol('page')
const outside: PageContext = {
    scroller: shallowRef(null),
    top: shallowRef(0),
    active: shallowRef(true),
}

/** Owned by the shell: each page layer provides its own. */
export function providePage(page: PageContext) {
    provide(pageKey, page)
}

function page(): PageContext {
    return hasInjectionContext() ? inject(pageKey, outside) : outside
}

export function useScrollRoot(): Readonly<ShallowRef<HTMLElement | null>> {
    return page().scroller
}

export function useScrollTop(): Readonly<Ref<number>> {
    return page().top
}

export function usePageActive(): Readonly<Ref<boolean>> {
    return page().active
}
