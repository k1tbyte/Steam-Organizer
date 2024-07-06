import {AnimatePresence, motion, MotionProps, type Point} from "framer-motion";
import React, {
    ButtonHTMLAttributes,
    cloneElement,
    FC, forwardRef, HTMLAttributes,
    isValidElement,
    ReactElement,
    ReactNode,
    useEffect, useImperativeHandle,
    useRef,
    useState
} from "react";
import {createPortal} from "react-dom";
import {cn} from "@/lib/utils.ts";

export const enum EPlacementX {
    Center,
    Left,
    Right,
}

export const enum EPlacementY {
    Center,
    Top,
    Bottom
}

type ContentType = (() => ReactElement | string) | ReactElement | string

interface IPopupBaseProps extends MotionProps {
    offset?: Point,
    alignX?: EPlacementX,
    alignY?: EPlacementY,
    className?: string,
    wrapIf?: boolean,
}

interface ITooltipProps extends IPopupBaseProps {
    children: ReactNode;
    message?: ContentType;
    openDelay?: number;
    canHover?: boolean;
}

export interface IPopupProps extends  IPopupBaseProps{
    children: ReactNode;
    content?: ContentType;
}

const clampY = (anchor: DOMRect, tip: DOMRect, placement: EPlacementY, offset: number = 0) => {
    const bottomPos = anchor.bottom + offset;
    const topPos = anchor.top - tip.height - offset;
    const middle = anchor.height / 2
    const centerPos = anchor.top + middle - (tip.height / 2);

    const isWithinBounds = (pos: number) => pos > 0 && pos + tip.height < window.innerHeight;

    switch (placement) {
        case EPlacementY.Bottom:
            return isWithinBounds(bottomPos) ? bottomPos : topPos;
        case EPlacementY.Top:
            return isWithinBounds(topPos) ? topPos : bottomPos;
        case EPlacementY.Center:
            return isWithinBounds(centerPos) ? centerPos :
                (isWithinBounds(bottomPos) ? bottomPos - middle : topPos + middle)
    }
};

const clampX = (anchor: DOMRect, tip: DOMRect, placement: EPlacementX, offset: number = 0) => {
    const leftPos = anchor.left - tip.width - offset;
    const rightPos = anchor.right + offset;
    const centerPos = anchor.left + (anchor.width / 2) - (tip.width / 2);

    const isWithinBounds = (pos: number) => pos > 0 && pos + tip.width < window.innerWidth;

    switch (placement) {
        case EPlacementX.Left:
            return isWithinBounds(leftPos) ? leftPos : (isWithinBounds(rightPos) ? rightPos : centerPos);

        case EPlacementX.Right:
            return isWithinBounds(rightPos) ? rightPos : (isWithinBounds(leftPos) ? leftPos : centerPos);

        case EPlacementX.Center:
            const align = Math.min(window.innerWidth - (centerPos + tip.width), 0)
            return Math.max(centerPos + align, Math.abs(offset));
    }
};

const rootId = document.getElementById("root")

const getPopup = (
    popupRef:  React.MutableRefObject<any>,
    triggerProps: { ref:  React.MutableRefObject<any> } & any,
    children: ReactNode,
    props: object,
    isOpen: boolean,
    className: string,
    popup: any) => {

    let trigger: ReactElement = isValidElement(children) ? cloneElement(children, triggerProps) :
        <div {...triggerProps} >
            {children}
        </div>

    return (
        <>
            {trigger}
            {createPortal(
                <AnimatePresence>
                    {
                        isOpen && popup &&
                        <motion.div ref={popupRef} key={Math.random()}
                                    className={cn("z-50 absolute bg-accent drop-shadow-md px-2.5 py-1 text-2xs rounded-2xm text-foreground whitespace-pre", className)}
                                    initial={{opacity: 0, translateY: "10px"}}
                                    animate={{opacity: 1, translateY: 0}}
                                    exit={{opacity: 0, translateY: "-10px"}}
                                    {...props}>
                            {typeof popup === 'function' ? popup() : popup}
                        </motion.div>
                    }
                </AnimatePresence>,
                rootId
            )}
        </>
    );
}

const align = (trigger: HTMLElement,
               popup: HTMLElement,
               alignX: EPlacementX, alignY: EPlacementY, offset: Point ) => {
    const triggerRect = trigger.getBoundingClientRect() as DOMRect;
    const popupRect = popup.getBoundingClientRect()
    popup.style.top = clampY(triggerRect, popupRect, alignY, offset.y) + 'px'
    popup.style.left = clampX(triggerRect, popupRect, alignX, offset.x) + 'px'
}

export const Popup: FC<IPopupProps> = ({
        children,
        className,
        content,
        alignX= EPlacementX.Right,
        alignY = EPlacementY.Center,
        offset= { x: 5, y: 0 },
        ...props
    }) => {
    const [isOpen, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(!popupRef.current || !isOpen) {
            return
        }
        const onClickOutside = () => setOpen(false);
        align(triggerRef.current, popupRef.current, alignX, alignY, offset)
        setTimeout(() => document.addEventListener('click', onClickOutside), 10)
        return () => document.removeEventListener('click', onClickOutside)
    }, [isOpen]);

    const triggerProps = {
        ref: triggerRef,
        onClick: () => setOpen(true),
    }
    return getPopup(popupRef, triggerProps, children,
        props,
        isOpen, className , content)
}

export const Tooltip = forwardRef<HTMLDivElement,ITooltipProps> (
    ({ children,
         message,
         className,
         alignX= EPlacementX.Center,
         alignY = EPlacementY.Top,
         offset= { x: 5, y: 5 },
         openDelay = 300,
         canHover = true,
        wrapIf = true,
         ...props },ref) => {

    if(!wrapIf) {
        return children;
    }

    const [isOpen, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const tipRef = useRef<HTMLDivElement>(null);
    let timer: number;

    useImperativeHandle(ref, () => tipRef.current)

    useEffect(() => {
        if(!tipRef.current) {
            return
        }
        align(triggerRef.current, tipRef.current, alignX, alignY, offset)
    }, [isOpen, children]);

    const debounceOpen = () => {
        clearTimeout(timer)
        if(!isOpen) {
            timer = setTimeout(() => setOpen(true), openDelay);
        }
    }

    const debounceClose = () => {
        clearTimeout(timer)
        if(isOpen) {
            timer = setTimeout(() => setOpen(false), 50);
        }
    }

    const events = {
        onMouseOver: debounceOpen,
        onFocus: debounceOpen,
        onMouseLeave: debounceClose
    }

    if(canHover) {
        Object.assign(props, events)
    }

    return getPopup(tipRef, { ref: triggerRef, ...events }, children,
        {...props}, isOpen, className, message)
})

export const popup = {
    right: () => {
        return {
            openDelay: 0,
            offset: { x: 20, y: 0 },
            alignX: EPlacementX.Right,
            alignY: EPlacementY.Center,
            initial: { opacity: 0, translateX: "-10px" },
            animate: { opacity: 1, translateX: 0 },
            exit: { opacity: 0, translateX: "10px" },
            canHover: false
        };
    }
}