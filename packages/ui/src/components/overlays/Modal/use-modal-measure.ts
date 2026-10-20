import { nextTick, onScopeDispose, type Ref, ref, watch } from 'vue'

interface ModalMeasureOptions {
    open: Ref<boolean>
    above: Readonly<Ref<number>>
    wrapper: Readonly<Ref<HTMLElement | null>>
    panel: Readonly<Ref<HTMLElement | null>>
    content: Readonly<Ref<HTMLElement | null>>
    setSize: (width: number, height: number) => void
}

export function useModalMeasure(options: ModalMeasureOptions) {
    const { open, above, wrapper, panel, content, setSize } = options

    const ownWidth = ref(0)
    const ownHeight = ref(0)

    function remeasure() {
        const el = panel.value
        if (!el || above.value > 0) return
        // Release the forced back-card height before measuring natural content.
        const frozenH = el.style.height
        el.style.height = 'auto'
        const nextH = el.scrollHeight
        const nextW = el.offsetWidth
        el.style.height = frozenH
        if (nextW === ownWidth.value && nextH === ownHeight.value) return
        ownWidth.value = nextW
        ownHeight.value = nextH
        setSize(ownWidth.value, ownHeight.value)
    }

    const resizeObserver =
        typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(remeasure)
    const mutationObserver =
        typeof MutationObserver === 'undefined'
            ? null
            : new MutationObserver(remeasure)
    onScopeDispose(() => {
        resizeObserver?.disconnect()
        mutationObserver?.disconnect()
    })

    const clipping = ref(false)
    let savedScrollTop = 0
    let cancelSettle: (() => void) | null = null
    watch(above, (layers, prevLayers) => {
        cancelSettle?.()
        if (layers > 0) {
            clipping.value = true
            if (prevLayers === 0) savedScrollTop = wrapper.value?.scrollTop ?? 0
            return
        }
        if (prevLayers === 0) return
        const el = panel.value
        if (!el) {
            clipping.value = false
            return
        }
        const settle = (event: TransitionEvent) => {
            if (event.target !== el || event.propertyName !== 'height') return
            cancelSettle?.()
            clipping.value = false
            if (savedScrollTop > 0)
                wrapper.value?.scrollTo({ top: savedScrollTop })
        }
        cancelSettle = () => {
            el.removeEventListener('transitionend', settle)
            cancelSettle = null
        }
        el.addEventListener('transitionend', settle)
    })

    watch(
        open,
        async (isOpen) => {
            resizeObserver?.disconnect()
            mutationObserver?.disconnect()
            if (!isOpen) return
            clipping.value = false
            await nextTick()
            const el = panel.value
            if (!el) return
            ownWidth.value = el.offsetWidth
            ownHeight.value = el.scrollHeight
            setSize(ownWidth.value, ownHeight.value)
            // Mutation catches leaving absolute children that resize observation misses.
            if (content.value) {
                resizeObserver?.observe(content.value)
                mutationObserver?.observe(content.value, {
                    childList: true,
                    subtree: true,
                })
            }
            if (wrapper.value) resizeObserver?.observe(wrapper.value)
        },
        { immediate: true },
    )

    return { ownWidth, ownHeight, clipping }
}
