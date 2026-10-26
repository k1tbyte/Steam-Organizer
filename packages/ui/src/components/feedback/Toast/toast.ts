import { ref } from 'vue'
import type { StatusColor } from '../../../color'

export interface ToastAction {
    label: string
    /** Runs, then the toast closes. */
    onClick: () => void
}

export interface ToastOptions {
    title: string
    /** A function gets the whole seconds left and follows them as they tick ("Undo for 5 s"). */
    description?: string | ((secondsLeft: number) => string)
    color?: StatusColor
    /** Replaces the color's glyph; a neutral toast has none of its own. */
    icon?: string
    /** Milliseconds before it closes; 0 stays until dismissed. Danger toasts stay by default. */
    duration?: number
    action?: ToastAction
    /** A bar drains over `duration`; hovering the toast pauses both. */
    progress?: boolean
}

export interface ToastItem extends ToastOptions {
    id: number
}

const MAX_TOASTS = 3

// Toast state is client-only, so one module ref is safe across callers.
const toasts = ref<ToastItem[]>([])
let nextId = 1

/** Past three, the oldest leaves. */
function add(options: ToastOptions): number {
    const id = nextId++
    const sticky = options.color === 'danger' && options.duration === undefined
    toasts.value = [
        ...toasts.value,
        { id, ...options, ...(sticky && { duration: 0 }) },
    ].slice(-MAX_TOASTS)
    return id
}

function remove(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function clear() {
    toasts.value = []
}

export function useToast() {
    return { toasts, add, remove, clear }
}
