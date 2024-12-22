import {AnimatePresence, HTMLMotionProps, motion, Point} from "framer-motion";
import {cloneElement, forwardRef, ReactElement, ReactNode, useImperativeHandle} from "react";
import {createPortal} from "react-dom";
import {cn} from "@/shared/lib/utils.ts";
import { usePopup} from "@/shared/ui/Popup/usePopup.ts";
import {EPlacementX, EPlacementY} from "@/shared/ui/Popup/positioning.ts";
import {IControlledStateOptions} from "@/shared/hooks/useControlledState.ts";

/**
 * Type for popup content that can be either a ReactNode or a function returning ReactNode
 */
export type ContentType = ReactNode | (() => ReactNode);

/**
 * Base props for popup positioning and styling
 * Extends motion.div props but omits the "content" prop to avoid conflicts
 */
export interface IPopupBaseProps extends Omit<HTMLMotionProps<"div">, "content"> {
    /** Offset from the trigger element. @default { x: 5, y: 0 } */
    offset?: Point;

    /** Horizontal alignment relative to trigger. @default EPlacementX.Right */
    alignX?: EPlacementX;

    /** Vertical alignment relative to trigger. @default EPlacementY.Center */
    alignY?: EPlacementY;

    /** Additional CSS classes for the popup container */
    className?: string;
}

/**
 * Main popup component props
 */
interface IPopupProps extends IPopupBaseProps, IControlledStateOptions<boolean> {
    /** Trigger element that toggles the popup */
    children: ReactElement;

    /** Content to be displayed in the popup */
    content: ContentType;

    /** Additional props to be spread onto the trigger element */
    triggerProps?: Record<string, any>;
}

/**
 * A base popup component that provides flexible positioning and animation capabilities.
 * Used as a foundation for context menus, tooltips, and other floating UI elements.
 *
 * @example
 * ```tsx
 * // Simple popup
 * <Popup content="Click menu">
 *   <button>Open</button>
 * </Popup>
 *
 * // Custom positioned popup
 * <Popup
 *   content={<MenuContent />}
 *   alignX={EPlacementX.Left}
 *   alignY={EPlacementY.Top}
 *   offset={{ x: 10, y: 5 }}
 * >
 *   <button>Open Menu</button>
 * </Popup>
 *
 * // With custom trigger props
 * <Popup
 *   content="Custom trigger behavior"
 *   triggerProps={{
 *     onMouseEnter: () => console.log('hover'),
 *     className: 'custom-trigger'
 *   }}
 * >
 *   <button>Customized Trigger</button>
 * </Popup>
 *
 * // Using default configurations
 * <Popup
 *   content="Side menu"
 *   {...popupDefaults.side}
 * >
 *   <button>Open Side Menu</button>
 * </Popup>
 *
 * // Controlled state
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Popup
 *   content="Controlled popup"
 *   state={isOpen}
 *   setState={setIsOpen}
 * >
 *   <button>Toggle popup</button>
 * </Popup>
 * ```
 */
export const Popup = forwardRef<HTMLDivElement, IPopupProps>(({
                                                                  children,
                                                                  content,
                                                                  className,
                                                                  triggerProps = {},
                                                                  setState,
                                                                  state,
                                                                  initialState,
                                                                  alignX = EPlacementX.Right,
                                                                  alignY = EPlacementY.Center,
                                                                  onStateChanged, offset,
                                                                  ...props
                                                              }, ref) => {
    const {
        isOpen,
        toggle,
        triggerRef,
        popupRef,
    } = usePopup({ setState, state, initialState, onStateChanged, offset, alignX, alignY  })

    useImperativeHandle(ref, () => popupRef.current);

    const trigger = cloneElement(children, {
        ref: triggerRef,
        onClick: toggle,
        ...triggerProps
    });

    return (
        <>
            {trigger}
            {createPortal(
                <AnimatePresence mode="wait">
                    {isOpen && (
                        <motion.div
                            ref={popupRef}
                            className={cn(
                                "z-50 absolute bg-accent drop-shadow-md px-2.5 py-1 text-2xs rounded-2xm text-foreground whitespace-pre",
                                className
                            )}
                            initial={{opacity: 0, translateY: "10px"}}
                            animate={{opacity: 1, translateY: 0}}
                            exit={{opacity: 0, translateY: "-10px"}}
                            {...props}
                        >
                            {typeof content === 'function' ? content() : content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
});

/**
 * Default configurations for common popup use cases
 */
export const popupDefaults = {
    side:  {
        openDelay: 0,
        closeDelay: 0,
        offset: { x: 20, y: 0 },
        alignX: EPlacementX.Right,
        alignY: EPlacementY.Center,
        initial: { opacity: 0, translateX: "-10px" },
        animate: { opacity: 1, translateX: 0 },
        exit: { opacity: 0, translateX: "10px" },
    }
}

Popup.displayName = 'Popup';