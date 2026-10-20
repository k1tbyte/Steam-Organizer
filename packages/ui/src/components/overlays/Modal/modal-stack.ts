import { computed, onUnmounted, type Ref, ref, watch } from 'vue'

interface StackEntry {
    id: symbol
    width: number
    height: number
}

const stack = ref<StackEntry[]>([])

export function useModalStack(open: Ref<boolean>) {
    const id = Symbol('fp-modal')
    const retainsFinalOverlay = ref(false)
    const animateOverlayIn = ref(false)
    const remove = () => {
        const wasOwner = stack.value[0]?.id === id
        stack.value = stack.value.filter((entry) => entry.id !== id)
        retainsFinalOverlay.value = wasOwner && stack.value.length === 0
    }

    watch(
        open,
        (isOpen) => {
            if (isOpen) {
                retainsFinalOverlay.value = false
                animateOverlayIn.value = stack.value.length === 0
                stack.value = [...stack.value, { id, width: 0, height: 0 }]
            } else {
                remove()
            }
        },
        // Route-driven modals can mount already open.
        { immediate: true },
    )
    onUnmounted(remove)

    const setSize = (width: number, height: number) => {
        stack.value = stack.value.map((entry) =>
            entry.id === id ? { ...entry, width, height } : entry,
        )
    }

    const above = computed(() => {
        const index = stack.value.findIndex((entry) => entry.id === id)
        return index === -1 ? 0 : stack.value.length - 1 - index
    })
    // Teleport order follows mount time, so z-index must follow open order.
    // Retain the last layer while a closing modal finishes its exit.
    let lastLayer = 0
    const layer = computed(() => {
        const index = stack.value.findIndex((entry) => entry.id === id)
        if (index !== -1) lastLayer = index
        return lastLayer
    })
    const ownsOverlay = computed(
        () => stack.value[0]?.id === id || retainsFinalOverlay.value,
    )
    const topWidth = computed(() => stack.value.at(-1)?.width ?? 0)
    const topHeight = computed(() => stack.value.at(-1)?.height ?? 0)

    return {
        above,
        layer,
        ownsOverlay,
        animateOverlayIn,
        setSize,
        topWidth,
        topHeight,
    }
}
