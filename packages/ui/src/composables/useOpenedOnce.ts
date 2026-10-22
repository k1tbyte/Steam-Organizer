import { type Ref, shallowRef, watch } from 'vue'

/** True from the first open on: a float mounts its portal only once needed, then keeps it for the exit animation. */
export function useOpenedOnce(
    open: Readonly<Ref<boolean>>,
): Readonly<Ref<boolean>> {
    const opened = shallowRef(open.value)
    if (!opened.value) watch(open, () => (opened.value = true), { once: true })
    return opened
}
