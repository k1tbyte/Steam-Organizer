import {
    MouseEvent,
    forwardRef,
    ReactElement,
    useCallback,
    useEffect,
    useRef,
    useState,
    useImperativeHandle
} from "react";
import {ContentType, IPopupBaseProps, Popup} from "./Popup.tsx";
import {cn} from "@/shared/lib/utils.ts";
import {EPlacementX, EPlacementY} from "@/shared/ui/Popup/positioning.ts";


interface ITooltipProps extends IPopupBaseProps {
    /** The element that triggers the tooltip */
    children: ReactElement;

    /** Content to be displayed in the tooltip. Can be a ReactNode or a function returning ReactNode */
    message: ContentType;

    /** Delay in milliseconds before the tooltip appears. @default 200 */
    openDelay?: number;

    /** Delay in milliseconds before the tooltip disappears. @default 150 */
    closeDelay?: number;

    /**
     * When true, allows users to hover over the tooltip content without it disappearing.
     * Useful for tooltips with interactive content or copyable text.
     * @default false
     */
    canHover?: boolean;
    preventOpen?: boolean;
}

/**
 * A Tooltip component that displays informative text when hovering over an element.
 * Built on top of the Popup component, it provides additional hover functionality and timing controls.
 *
 * @example
 * // Basic usage
 * <Tooltip message="Simple tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * // With hover capability and custom delays
 * <Tooltip
 *   message="You can hover over this tooltip"
 *   canHover={true}
 *   openDelay={300}
 *   closeDelay={200}
 * >
 *   <button>Hover for more info</button>
 * </Tooltip>
 *
 * // With custom positioning
 * <Tooltip
 *   message="Custom positioned tooltip"
 *   alignX={EPlacementX.Left}
 *   alignY={EPlacementY.Top}
 *   offset={{ x: 10, y: 5 }}
 * >
 *   <button>Hover me</button>
 * </Tooltip>
 */
export const Tooltip = forwardRef<HTMLDivElement, ITooltipProps>(({
                                                                      message,
                                                                      openDelay = 200,
                                                                      closeDelay = 150,
                                                                      alignY = EPlacementY.Top,
                                                                      alignX = EPlacementX.Center,
                                                                      offset = { x: 5, y: 5 },
                                                                      className,
                                                                      children,
                                                                      canHover = false,
                                                                      preventOpen,
                                                                      ...props
                                                                  }, ref) => {
    if(preventOpen) {
        return children;
    }

    const [shouldShow, setShouldShow] = useState(false);
    const timerRef = useRef<number>();
    const tooltipRef = useRef<HTMLDivElement>(null);
    const isHoveringTooltip = useRef(false);

    useImperativeHandle(ref, () => tooltipRef.current);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        clearTimer();
        timerRef.current = window.setTimeout(() => {
            setShouldShow(true);
        }, openDelay);
    }, [openDelay, clearTimer]);

    const handleMouseLeave = useCallback((event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
        // Checking if the cursor has moved to the tooltip
        if (canHover && tooltipRef.current?.contains(event.relatedTarget as Node)) {
            isHoveringTooltip.current = true;
            return;
        }

        clearTimer();
        timerRef.current = window.setTimeout(() => {
            // Close only if not hovered over the tooltip
            if (!isHoveringTooltip.current) {
                setShouldShow(false);
            }
        }, closeDelay);
    }, [closeDelay, clearTimer, canHover]);

    // Handlers for the tooltip itself to prevent it from closing when hovered
    const handleTooltipMouseEnter = useCallback(() => {
        if (canHover) {
            isHoveringTooltip.current = true;
            clearTimer();
        }
    }, [canHover, clearTimer]);

    const handleTooltipMouseLeave = useCallback((event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
        if (!canHover) {
            return;
        }

        isHoveringTooltip.current = false;
        // Check if the cursor has returned to the trigger
        const triggerElement = (event.currentTarget as HTMLElement).previousElementSibling;
        if (!triggerElement?.contains(event.relatedTarget as Node)) {
            handleMouseLeave(event);
        }
    }, [canHover, handleMouseLeave]);

    /* Without this effect, the following problem could occur:
     *|
     *| - The user hovers over the trigger
     *| - A timer is started to open the tooltip
     *| - Before the timer expires, the component is removed from the DOM
     *| - The timer will still fire and try to update the state of a non-existent component
     */
    useEffect(() => {
        return clearTimer;
    }, [clearTimer]);

    return (
        <Popup
            alignX={alignX}
            alignY={alignY}
            offset={offset}
            {...props}
            state={shouldShow}
            setState={setShouldShow}
            content={
                <div
                    ref={tooltipRef}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                >
                    {message instanceof Function ? message() : message}
                </div>
            }
            triggerProps={{
                onMouseEnter: handleMouseEnter,
                onMouseLeave: handleMouseLeave,
                onFocus: handleMouseEnter,
                onBlur: handleMouseLeave,
                onClick: undefined
            }}
        >
            {children}
        </Popup>
    );
});

Tooltip.displayName = 'Tooltip';