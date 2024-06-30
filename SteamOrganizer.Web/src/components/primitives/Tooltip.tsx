import {AnimatePresence, motion} from "framer-motion";
import {
    ButtonHTMLAttributes,
    cloneElement,
    FC, forwardRef,
    isValidElement,
    ReactElement,
    ReactNode,
    useEffect, useImperativeHandle,
    useRef,
    useState
} from "react";
import {createPortal} from "react-dom";

interface ITooltipProps extends ButtonHTMLAttributes<HTMLDivElement>{
    children: ReactNode;
    message?: (() => ReactElement | string) | ReactElement | string;
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
    const centered = anchor.left - tip.width / 2 + anchor.width / 2;
    const align = Math.min(window.innerWidth - (centered + tip.width), 0)
    return Math.max(centered + align, Math.abs(offset))
}

const rootId = document.getElementById("root")

export const Tooltip = forwardRef<HTMLDivElement,ITooltipProps> (
    ({ children,
         message,
         offsetX = 5,
         offsetY = 5,
         alignBottom,
         openDelay = 300,
         ...props },ref) => {

    const [isOpen, setOpen] = useState(false);
    const elementRef = useRef(null);
    const tipRef = useRef<HTMLDivElement>(null);
    let timer: number;

    useImperativeHandle(ref, () => tipRef.current)

    useEffect(() => {
        if(!tipRef.current) {
            return
        }
        const tip = tipRef.current;

        const anchorRect = elementRef.current.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect()
        tip.style.top = align(anchorRect, tipRect, alignBottom, offsetY) + 'px'
        tip.style.left = clamp(anchorRect, tipRect, offsetX) + 'px'
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

    const triggerProps = {
        ref: elementRef,
        onMouseOver: debounceOpen,
        onFocus: debounceOpen,
        onMouseLeave: debounceClose
    }

    let trigger: ReactElement = isValidElement(children) ? cloneElement(children, triggerProps) :
        <div {...props} {...triggerProps} >
            {children}
        </div>

    return (

        <>
            {trigger}
            {createPortal(
                <AnimatePresence>
                    {
                        isOpen && message &&
                        <motion.div ref={tipRef} key={Math.random()}
                                    className="z-50 absolute bg-accent drop-shadow-md px-2.5 py-1 text-[13px] rounded-2xm text-foreground whitespace-pre"
                                    onMouseOver={debounceOpen} onFocus={debounceOpen} onMouseLeave={debounceClose}
                                    initial={{opacity: 0, translateY: "10px"}}
                                    animate={{opacity: 1, translateY: 0}}
                                    exit={{opacity: 0, translateY: "-10px"}}>
                            {typeof message === 'function' ? message() : message}
                        </motion.div>
                    }
                </AnimatePresence>,
                rootId
            )}
        </>
    );
})