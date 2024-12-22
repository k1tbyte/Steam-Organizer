import {useCallback, useEffect, useRef, useState} from "react";
import {align, EPlacementX, EPlacementY} from "@/shared/ui/Popup/positioning.ts";
import {Point} from "framer-motion";
import {IControlledStateOptions, useControlledState} from "@/shared/hooks/useControlledState.ts";

/**
 * Props for usePopup hook
 */
interface UsePopupProps extends IControlledStateOptions<boolean> {
    /** Horizontal alignment of the popup relative to the trigger */
    alignX: EPlacementX;

    /** Vertical alignment of the popup relative to the trigger */
    alignY: EPlacementY;

    /** Offset from the calculated position. @default { x: 5, y: 0 } */
    offset?: Point;
}

/**
 * A custom hook that handles popup positioning, state management, and click outside behavior.
 *
 * A hook that provides popup functionality including:
 * - Controlled/uncontrolled state management
 * - Automatic positioning
 * - Window resize handling
 * - Scroll position updates
 * - Click outside detection
 *
 * @returns Object containing state and refs for popup management
 *
 * @example
 * ```tsx
 * function MyPopup() {
 *   const {
 *     isOpen,
 *     setIsOpen,
 *     toggle,
 *     triggerRef,
 *     popupRef,
 *   } = usePopup({
 *     alignX: EPlacementX.Right,
 *     alignY: EPlacementY.Center,
 *   });
 *
 *   return (
 *     <>
 *       <button ref={triggerRef} onClick={toggle}>
 *         Toggle Popup
 *       </button>
 *       {isOpen && (
 *         <div ref={popupRef}>
 *           Popup Content
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export const usePopup = ({
                             alignX,
                             alignY,
                             offset = { x: 5, y: 0 },
                             ...props
                         }: UsePopupProps) => {
    const triggerRef = useRef<HTMLElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    /** Controlled state management using useControlledState hook */
    const { value: isOpen, setValue: setIsOpen } = useControlledState({...props});

    // Position update and click outside handling
    useEffect(() => {
        if (!isOpen || !popupRef.current || !triggerRef.current) return;

        /** Updates popup position based on trigger position and alignment settings */
        const updatePosition = () => {
            if (popupRef.current && triggerRef.current) {
                align(triggerRef.current, popupRef.current, alignX, alignY, offset);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        /** Handles clicks outside popup and trigger elements */
        const closeOnClickOutside = (e: MouseEvent) => {
            if (!popupRef.current?.contains(e.target as Node) &&
                !triggerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnClickOutside);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
            document.removeEventListener('mousedown', closeOnClickOutside);
        };
    }, [isOpen, alignX, alignY, offset, setIsOpen]);

    /** Toggles popup open state */
    const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

    return {
        isOpen,
        setIsOpen,
        toggle,
        triggerRef,
        popupRef,
    };
};