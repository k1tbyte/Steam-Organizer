import { onMounted, onUnmounted, type Ref, ref } from 'vue'

// One observer for every watched element on the page.
const checks = new WeakMap<Element, () => void>()
let observer: ResizeObserver | undefined

function shared(): ResizeObserver {
    observer ??= new ResizeObserver((entries) => {
        for (const entry of entries) checks.get(entry.target)?.()
    })
    return observer
}

/** Whether the element's content is wider than its box (cut off by `truncate`). */
export function useClipped(el: Readonly<Ref<HTMLElement | null>>) {
    const clipped = ref(false)

    function check() {
        const node = el.value
        if (node) clipped.value = node.scrollWidth > node.clientWidth
    }

    onMounted(() => {
        const node = el.value
        if (!node) return
        checks.set(node, check)
        shared().observe(node)
        check()
    })
    onUnmounted(() => {
        const node = el.value
        if (node) shared().unobserve(node)
    })

    return { clipped, check }
}
