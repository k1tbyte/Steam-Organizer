import type {Point} from "framer-motion";

/**
 * Horizontal placement options for popup positioning
 */
export const enum EPlacement {
    // Base alignments (first 4 bits for X)
    Left       = 1 << 0,  // 0001
    Center     = 1 << 1,  // 0010
    Right      = 1 << 2,  // 0100
    FitX       = 1 << 3,  // 1000

    // Vertical alignments (next 4 bits for Y)
    Top        = 1 << 4,  // 0001 0000
    Middle     = 1 << 5,  // 0010 0000
    Bottom     = 1 << 6,  // 0100 0000
    FitY       = 1 << 7,  // 1000 0000

    // Комбинации для удобства
    TopLeft    = Top | Left,
    TopCenter  = Top | Center,
    TopRight   = Top | Right,
    TopFit     = Top | FitX,

    MiddleLeft    = Middle | Left,
    MiddleCenter  = Middle | Center,
    MiddleRight   = Middle | Right,
    MiddleFit     = Middle | FitX,

    BottomLeft    = Bottom | Left,
    BottomCenter  = Bottom | Center,
    BottomRight   = Bottom | Right,
    BottomFit     = Bottom | FitX,

    FitLeft    = FitY | Left,
    FitCenter  = FitY | Center,
    FitRight   = FitY | Right,
    Fit        = FitY | FitX
}

interface Position {
    top: number;
    left: number;
    width?: number;
    height?: number;
}


const calculatePosition = (
    anchor: DOMRect,
    popup: DOMRect,
    placement: EPlacement,
    offset: Point = { x: 0, y: 0 }
): Position => {
    const position: Position = {
        top: 0,
        left: 0
    };

    // Вспомогательные функции для проверки границ
    const isWithinX = (pos: number) => pos >= 0 && pos + popup.width <= window.innerWidth;
    const isWithinY = (pos: number) => pos >= 0 && pos + popup.height <= window.innerHeight;

    // Вычисление горизонтальной позиции
    const calculateX = (): number => {
        const leftPos = anchor.left - popup.width - offset.x;
        const rightPos = anchor.right + offset.x;
        const centerPos = anchor.left + (anchor.width - popup.width) / 2;

        if ((placement & EPlacement.Left) === EPlacement.Left) {
            return isWithinX(leftPos) ? leftPos :
                isWithinX(rightPos) ? rightPos : centerPos;
        }

        if ((placement & EPlacement.Right) === EPlacement.Right) {
            return isWithinX(rightPos) ? rightPos :
                isWithinX(leftPos) ? leftPos : centerPos;
        }

        if ((placement & EPlacement.Center) === EPlacement.Center) {
            const align = Math.min(window.innerWidth - (centerPos + popup.width), 0);
            return Math.max(centerPos + align, Math.abs(offset.x));
        }

        if ((placement & EPlacement.FitX) === EPlacement.FitX) {
            position.width = anchor.width;
            return anchor.left;
        }

        return centerPos;
    };

    // Вычисление вертикальной позиции
    const calculateY = (): number => {
        const topPos = anchor.top - popup.height - offset.y;
        const bottomPos = anchor.bottom + offset.y;
        const middlePos = anchor.top + (anchor.height - popup.height) / 2;

        if ((placement & EPlacement.Top) === EPlacement.Top) {
            return isWithinY(topPos) ? topPos :
                isWithinY(bottomPos) ? bottomPos : middlePos;
        }

        if ((placement & EPlacement.Bottom) === EPlacement.Bottom) {
            return isWithinY(bottomPos) ? bottomPos :
                isWithinY(topPos) ? topPos : middlePos;
        }

        if ((placement & EPlacement.Middle) === EPlacement.Middle) {
            return isWithinY(middlePos) ? middlePos :
                isWithinY(bottomPos) ? bottomPos - anchor.height / 2 :
                    topPos + anchor.height / 2;
        }

        if ((placement & EPlacement.FitY) === EPlacement.FitY) {
            position.height = anchor.height;
            return anchor.top;
        }

        return middlePos;
    };

    position.left = calculateX();
    position.top = calculateY();

    return position;
};

/**
 * Positions a popup element relative to its trigger element with smart overflow handling
 *
 * @param trigger - The element that triggers the popup
 * @param placement -
 * @param popup - The popup element to be positioned
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
export const align = (
    trigger: HTMLElement,
    popup: HTMLElement,
    placement: EPlacement,
    offset: Point = { x: 0, y: 0 }
) => {
    const triggerRect = trigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    const { top, left, width, height } = calculatePosition(
        triggerRect,
        popupRect,
        placement,
        offset
    );

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;

    if (width !== undefined) {
        popup.style.width = `${width}px`;
    }

    if (height !== undefined) {
        popup.style.height = `${height}px`;
    }
};