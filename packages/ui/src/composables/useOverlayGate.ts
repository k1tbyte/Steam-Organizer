import { type InjectionKey, inject, provide, type Ref, watch } from 'vue'

const gateKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol('fp-overlay-gate')

/** A subtree kept mounted while hidden (a page behind the current one) closes the overlays it
 *  opened: they portal out of it, so hiding the subtree alone leaves them on screen. */
export function provideOverlayGate(shown: Readonly<Ref<boolean>>) {
    provide(gateKey, shown)
}

export function useOverlayGate(open: Ref<boolean>) {
    const shown = inject(gateKey, null)
    if (shown)
        watch(shown, (on) => {
            if (!on) open.value = false
        })
}
