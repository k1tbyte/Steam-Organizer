// Split reka side and alignment only at the overlay boundary.
export type Side = 'top' | 'right' | 'bottom' | 'left'
export type Align = 'start' | 'center' | 'end'

export type Placement =
    | Side
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end'

export function splitPlacement(placement: Placement): {
    side: Side
    align: Align
} {
    const [side, align] = placement.split('-') as [Side, Align | undefined]
    return { side, align: align ?? 'center' }
}
