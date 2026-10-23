import { useQueryOverlay } from '#core'

/** Edit mode: `?edit`. The list shows its cards in the vault order to reorder, pick and act on in batch; Back, Done and Esc leave it. */
export function useEditMode() {
    return useQueryOverlay('edit')
}
