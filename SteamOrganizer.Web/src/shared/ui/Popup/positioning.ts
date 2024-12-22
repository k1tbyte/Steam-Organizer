import type {Point} from "framer-motion";

/**
 * Horizontal placement options for popup positioning
 */
export const enum EPlacementX {
    /** Align popup horizontally centered with trigger */
    Center,
    /** Align popup to the left of trigger */
    Left,
    /** Align popup to the right of trigger */
    Right,
}

/**
 * Vertical placement options for popup positioning
 */
export const enum EPlacementY {
    /** Align popup vertically centered with trigger */
    Center,
    /** Align popup above the trigger */
    Top,
    /** Align popup below the trigger */
    Bottom
}

/**
 * Calculates and clamps the vertical position of a popup element
 *
 * @param anchor - The trigger element's DOMRect
 * @param tip - The popup element's DOMRect
 * @param placement - Desired vertical placement
 * @param offset - Vertical offset in pixels
 * @returns Calculated vertical position in pixels
 */
const clampY = (anchor: DOMRect, tip: DOMRect, placement: EPlacementY, offset: number = 0) => {
    const bottomPos = anchor.bottom + offset;
    const topPos = anchor.top - tip.height - offset;
    const middle = anchor.height / 2
    const centerPos = anchor.top + middle - (tip.height / 2);

    /**
     * Checks if the popup would be within viewport bounds at given position
     */
    const isWithinBounds = (pos: number) => pos > 0 && pos + tip.height < window.innerHeight;

    switch (placement) {
        case EPlacementY.Bottom:
            // Try bottom first, fallback to top if out of bounds
            return isWithinBounds(bottomPos) ? bottomPos : topPos;
        case EPlacementY.Top:
            // Try top first, fallback to bottom if out of bounds
            return isWithinBounds(topPos) ? topPos : bottomPos;
        case EPlacementY.Center:
            // Try center, fallback to adjusted bottom/top if out of bounds
            return isWithinBounds(centerPos) ? centerPos :
                (isWithinBounds(bottomPos) ? bottomPos - middle : topPos + middle)
    }
};

/**
 * Calculates and clamps the horizontal position of a popup element
 *
 * @param anchor - The trigger element's DOMRect
 * @param tip - The popup element's DOMRect
 * @param placement - Desired horizontal placement
 * @param offset - Horizontal offset in pixels
 * @returns Calculated horizontal position in pixels
 */
const clampX = (anchor: DOMRect, tip: DOMRect, placement: EPlacementX, offset: number = 0) => {
    const leftPos = anchor.left - tip.width - offset;
    const rightPos = anchor.right + offset;
    const centerPos = anchor.left + (anchor.width / 2) - (tip.width / 2);

    /**
     * Checks if the popup would be within viewport bounds at given position
     */
    const isWithinBounds = (pos: number) => pos > 0 && pos + tip.width < window.innerWidth;

    switch (placement) {
        case EPlacementX.Left:
            // Try left, then right, fallback to center
            return isWithinBounds(leftPos) ? leftPos : (isWithinBounds(rightPos) ? rightPos : centerPos);

        case EPlacementX.Right:
            // Try right, then left, fallback to center
            return isWithinBounds(rightPos) ? rightPos : (isWithinBounds(leftPos) ? leftPos : centerPos);

        case EPlacementX.Center:
            // Center with viewport boundary adjustment
            const align = Math.min(window.innerWidth - (centerPos + tip.width), 0)
            return Math.max(centerPos + align, Math.abs(offset));
    }
};

/**
 * Positions a popup element relative to its trigger element with smart overflow handling
 *
 * @param trigger - The element that triggers the popup
 * @param popup - The popup element to be positioned
 * @param alignX - Horizontal alignment preference
 * @param alignY - Vertical alignment preference
 * @param offset - Offset from the calculated position
 *
 * @example
 * ```tsx
 * // Basic usage
 * align(
 *   triggerElement,
 *   popupElement,
 *   EPlacementX.Right,
 *   EPlacementY.Center,
 *   { x: 5, y: 0 }
 * );
 *
 * // Center alignment
 * align(
 *   triggerElement,
 *   popupElement,
 *   EPlacementX.Center,
 *   EPlacementY.Center,
 *   { x: 0, y: 0 }
 * );
 * ```
 */
export const align = (trigger: HTMLElement,
               popup: HTMLElement,
               alignX: EPlacementX, alignY: EPlacementY, offset: Point ) => {
    const triggerRect = trigger.getBoundingClientRect() as DOMRect;
    const popupRect = popup.getBoundingClientRect()
    popup.style.top = clampY(triggerRect, popupRect, alignY, offset.y) + 'px'
    popup.style.left = clampX(triggerRect, popupRect, alignX, offset.x) + 'px'
}