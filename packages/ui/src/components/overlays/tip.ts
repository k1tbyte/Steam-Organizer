import type { Placement } from '../../placement'

export interface TipOptions {
    /** The text also names the trigger: an icon-only control loses its name with `title`. */
    label?: boolean
    placement?: Placement
    disabled?: boolean
}

/** Marks a trigger for `FpTooltipHost`, which shows the one bubble: `v-bind="tip(text)"`, nothing mounts per hint. */
export function tip(
    text: string | undefined,
    { label, placement = 'top', disabled }: TipOptions = {},
) {
    const shown = !disabled && !!text
    return {
        'data-tip': shown ? text : undefined,
        'data-tip-placement': placement === 'top' ? undefined : placement,
        // Reka's own trigger mark: its hover grace area treats the element as a trigger.
        'data-grace-area-trigger': shown ? '' : undefined,
        'aria-label': label ? text : undefined,
    }
}
