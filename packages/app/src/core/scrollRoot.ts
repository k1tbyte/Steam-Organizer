import { type ShallowRef, shallowRef } from 'vue'

// Pages scroll inside the shell's container, not the window; virtual lists measure against it.
const root: ShallowRef<HTMLElement | null> = shallowRef(null)

export function useScrollRoot(): Readonly<ShallowRef<HTMLElement | null>> {
    return root
}

/** Owned by the shell. */
export function setScrollRoot(el: HTMLElement | null) {
    root.value = el
}
