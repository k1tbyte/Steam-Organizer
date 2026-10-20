import { ref } from 'vue'
import type { StatusColor } from '../../../color'

export interface ToastAction {
    label: string
    onClick: () => void
}

export interface ToastOptions {
    title: string
    description?: string
    color?: StatusColor
    duration?: number
    actions?: ToastAction[]
}

export interface ToastItem extends ToastOptions {
    id: number
    open: boolean
    /** Content rendered, so closing plays an exit that ends in `forget`. */
    mounted: boolean
}

export interface ToastStack {
    y: number
    scale: number
    opacity: number
    height?: number
    z: number
}

const MAX_TOASTS = 5

// Toast state is client-only, so one module ref is safe across callers.
const toasts = ref<ToastItem[]>([])
let nextId = 1

function add(options: ToastOptions): number {
    const id = nextId++
    toasts.value = [
        ...toasts.value,
        { id, open: true, mounted: false, ...options },
    ]
    // Evict through remove so overflow still plays its exit animation.
    const open = toasts.value.filter((item) => item.open)
    for (const item of open.slice(0, -MAX_TOASTS)) remove(item.id)
    return id
}

function update(id: number, patch: Partial<ToastOptions>) {
    const toast = toasts.value.find((item) => item.id === id)
    if (toast) Object.assign(toast, patch)
}

/** Starts the exit; the toast calls `forget` once its exit animation ends. */
function remove(id: number) {
    const toast = toasts.value.find((item) => item.id === id)
    if (!toast) return
    // Never rendered (evicted or closed in the same tick): no exit will play.
    if (!toast.mounted) return forget(id)
    toast.open = false
}

function markMounted(id: number) {
    const toast = toasts.value.find((item) => item.id === id)
    if (toast) toast.mounted = true
}

function forget(id: number) {
    toasts.value = toasts.value.filter((item) => item.id !== id)
}

function clear() {
    for (const toast of toasts.value) remove(toast.id)
}

export function useToast() {
    return { toasts, add, update, remove, forget, markMounted, clear }
}
