import {AnimatePresence, motion} from "framer-motion";
import {ButtonHTMLAttributes, FC, ReactElement, ReactNode, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";

interface ITooltipProps extends ButtonHTMLAttributes<HTMLDivElement>{
    children: ReactNode;
    message?: ReactElement | string;
    openDelay?: number;
    offsetY?: number;
    offsetX?: number;
    alignBottom?: boolean;
}

const align = (anchor: DOMRect, tip: DOMRect, bottom: boolean, offset: number = 0) => {
    const bottomPos = anchor.bottom + offset
    if(bottom && bottomPos + tip.height < window.innerHeight) {
        return anchor.bottom + offset
    }
    const topPoints = anchor.bottom - anchor.height - tip.height - offset
    return (topPoints < 0 ?  bottomPos : topPoints)
}

const clamp = (anchor: DOMRect, tip: DOMRect, offset: number = 0) => {
    const centered = anchor.left + (anchor.width / 2 - tip.width / 2);
    const align = Math.min(window.innerWidth - (centered + tip.width), 0)
    return Math.max(centered + align + offset, Math.abs(offset))
}

const rootId = document.getElementById("root")

export const Tooltip: FC<ITooltipProps> =
    ({ children,
         message,
         offsetX = -5,
         offsetY = 5,
         alignBottom,
         openDelay = 300,
         ...props }) => {

    const [isOpen, setOpen] = useState(false);
    const [tooltipStyle, setTooltipStyle] = useState({});
    const elementRef = useRef(null);
    const tipRef = useRef<HTMLDivElement>(null)
    let timer: number;

    useEffect(() => {
        if(!tipRef.current) {
            return
        }

        const anchorRect = elementRef.current.getBoundingClientRect();
        const tipRect = tipRef.current.getBoundingClientRect()
        setTooltipStyle({
            top:  align(anchorRect, tipRect, alignBottom, offsetY) + 'px',
            left: clamp(anchorRect, tipRect, offsetX) + 'px',
        });
    }, [isOpen]);

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

    return (

        <div ref={elementRef}
            onMouseOver={debounceOpen}
            onFocus={debounceOpen}
            onMouseLeave={debounceClose}
            {...props}
        >
            {children}
            {createPortal(
                <AnimatePresence>
                    {
                        isOpen && message &&
                        <motion.div ref={tipRef} key={Math.random()}
                                    className="z-50 bg-accent drop-shadow-md px-2.5 py-1 text-[13px] rounded-2xm text-foreground"
                                    initial={{opacity: 0, translateY: "10px"}}
                                    animate={{opacity: 1, translateY: 0}}
                                    exit={{opacity: 0, translateY: "-10px"}}
                                    style={{...tooltipStyle, position: 'absolute'}}>
                            {message}
                        </motion.div>
                    }
                </AnimatePresence>,
                rootId
            )}
        </div>
    );
}