import { useQueryOverlay } from '#core'

/** Reorder mode: `?reorder`. The list shows the vault order to drag cards in; Back, Done and Esc leave it. */
export function useReorderMode() {
    return useQueryOverlay('reorder')
}
