import {AnimatePresence, HTMLMotionProps, motion, Point} from "framer-motion";
import {cloneElement, forwardRef, MutableRefObject, ReactElement, ReactNode, useImperativeHandle} from "react";
import {createPortal} from "react-dom";
import {cn} from "@/shared/lib/utils";
import { usePopup} from "@/shared/ui/Popup/usePopup";
import { EPlacement } from "@/shared/ui/Popup/positioning";
import {IControlledStateOptions} from "@/shared/hooks/useControlledState";
import styles from "./Popup.module.css";

/**
 * Type for popup content that can be either a ReactNode or a function returning ReactNode
 */
export type ContentType = ReactNode | (() => ReactNode);

/**
 * Main popup component props
 */
export interface IPopupProps extends Omit<HTMLMotionProps<"div">, "content">, IControlledStateOptions<boolean> {
    /** Offset from the trigger element. @default { x: 5, y: 0 } */
    offset?: Point;
    placement?: EPlacement;

    /** Additional CSS classes for the popup container */
    className?: string;

    /** Trigger element that toggles the popup */
    children: ReactElement;
    childrenRef?: MutableRefObject<HTMLElement>;

    /** Content to be displayed in the popup */
    content: ContentType;

    /** Additional props to be spread onto the trigger element */
    triggerProps?: Record<string, any>;

    /** Variant of the popup */
    variant?: PopupVariant;

    asToggle?: boolean;
    timeout?: number;
}

export const enum PopupVariant {
    Raw,
    Default
}

const popupVariants = {
    [PopupVariant.Raw]: "z-50 absolute",
    [PopupVariant.Default]: `z-50 ${styles.popupDefault}`
}

/**
 * A base popup component that provides flexible positioning and animation capabilities.
 * Used as a foundation for context menus, tooltips, and other floating UI components.
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
                                                                  timeout,
                                                                  childrenRef,
                                                                  asToggle = true,
                                                                  variant = PopupVariant.Default,
                                                                  placement = EPlacement.MiddleRight,
                                                                  onStateChanged, offset,
                                                                  ...props
                                                              }, ref) => {
    const {
        isOpen,
        toggle,
        triggerRef,
        setIsOpen,
        popupRef,
    } = usePopup({ setState, state, initialState, onStateChanged, offset, position: placement, timeout  })

    useImperativeHandle(ref, () => popupRef.current);
    useImperativeHandle(childrenRef, () => triggerRef.current)

    const trigger = cloneElement(children, {
        ref: triggerRef,
        onClick: asToggle ? toggle : () => setIsOpen(true),
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
                                popupVariants[variant],
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
        placement: EPlacement.MiddleRight,
        initial: { opacity: 0, translateX: "-10px" },
        animate: { opacity: 1, translateX: 0 },
        exit: { opacity: 0, translateX: "10px" },
    }
}

Popup.displayName = 'Popup';