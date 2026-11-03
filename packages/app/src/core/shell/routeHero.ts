import { type ShallowRef, shallowRef } from 'vue'

// The key (an account id) of the element a hero transition morphs between list and detail page.
const key: ShallowRef<string | null> = shallowRef(null)

/** Read by the list item and the detail page that carry `data-vt-hero` while a hero transition runs. */
export function useRouteHero(): Readonly<ShallowRef<string | null>> {
    return key
}

/** Owned by the shell. */
export function setRouteHero(value: string | null) {
    key.value = value
}
