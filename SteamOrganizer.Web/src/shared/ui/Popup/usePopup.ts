import {useCallback, useEffect, useRef, useState} from "react";
import {align, EPlacement} from "./positioning";
import {Point} from "framer-motion";
import {IControlledStateOptions, useControlledState} from "@/shared/hooks/useControlledState";
import {getScrollParent} from "@/shared/lib/utils";

/**
 * Props for usePopup hook
 */
interface UsePopupProps extends IControlledStateOptions<boolean> {
    position: EPlacement;

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
                             position,
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

        const onScrollChanged = () => setIsOpen(false)
        const scroller = getScrollParent(triggerRef.current);
        scroller.addEventListener("scroll", onScrollChanged)

        /** Updates popup position based on trigger position and alignment settings */
        const updatePosition = () => {
            if (popupRef.current && triggerRef.current) {
                align(triggerRef.current, popupRef.current, position, offset);
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);

        /** Handles clicks outside popup and trigger components */
        const closeOnClickOutside = (e: MouseEvent) => {
            if (!popupRef.current?.contains(e.target as Node) &&
                !triggerRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeOnClickOutside);

        return () => {
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener('pointerdown', closeOnClickOutside);
            scroller.removeEventListener('scroll', onScrollChanged);
        };
    }, [isOpen, position, offset, setIsOpen]);

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