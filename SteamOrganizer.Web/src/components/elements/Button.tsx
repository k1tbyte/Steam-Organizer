import {ButtonHTMLAttributes, FC, ReactNode, RefObject, useEffect, useRef, useState} from "react";
import MutableRef from "../../types/mutableRef.ts";
import {cn} from "../../lib/utils.ts";

export interface IButtonActions {
    invalidate: (delay: number) => void,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    ref: RefObject<HTMLButtonElement>
}

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string,
    children: ReactNode
    actions?: MutableRef<IButtonActions>
}

const Button: FC<IButtonProps> = (
    { className, children, actions,...props}) => {

    const buttonRef = useRef<HTMLButtonElement>(null)
    const [isLoading, setLoading] = useState(false);

    if(actions) {
        useEffect(() => {
            actions.payload = {
                ref: buttonRef,
                setLoading: setLoading,
                invalidate: (delay: number) => {
                    buttonRef.current!.classList.add('invalidate');
                    setTimeout(() =>
                        buttonRef.current!.classList.remove('invalidate'), delay);
                }
            }
        },[actions])
    }

    return (
        <button ref={actions?.payload?.ref} disabled={isLoading}
                className={cn("rounded-xm font-semibold select-none px-3 py-1 flex-center text-2xs min-h-7 bg-pr-4 text-pr-3 transition-colors enabled:hover:text-fg-3 " , className)} {...props}>

            {isLoading ?
                <svg className="animate-spin h-5 w-5 text-fg-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="transparent"
                            strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                :
                children
            }
        </button>
    )
}


export default Button;