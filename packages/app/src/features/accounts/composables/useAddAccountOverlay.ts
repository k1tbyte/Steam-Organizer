import { useQueryOverlay } from '#core'

/** Add account: `?add-account`, a window on desktop and a sheet on phones. */
export function useAddAccountOverlay() {
    return useQueryOverlay('add-account')
}
