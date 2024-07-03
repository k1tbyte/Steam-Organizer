import {
    ButtonHTMLAttributes,
    forwardRef,
    ReactNode,
    RefObject,
    useEffect,
    useImperativeHandle,
    useRef,
    useState
} from "react";
import Ref from "../../types/ref.ts";
import {cn} from "../../lib/utils.ts";

export const enum EButtonVariant {
    Primary,
    Outlined,
    Transparent,
}

export interface IButtonActions {
    invalidate: (delay: number) => void,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
    ref: RefObject<HTMLButtonElement>
}

interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string,
    children: ReactNode,
    isLoading?: boolean;
    actions?: Ref<IButtonActions>;
    variant?: EButtonVariant;
}

const variants = [
    "font-semibold  flex-center  bg-secondary text-accent  hover:text-foreground-accent rounded-xm",
    "border-tertiary py-1 px-3 border text-secondary font-thin hover:bg-tertiary rounded-xm",
    "hover:bg-accent text-foreground-muted hover:text-foreground w-full text-left"
]

const Button = forwardRef<HTMLButtonElement, IButtonProps>((
    {
        className,
        children,
        actions,
        isLoading = false,
        variant = EButtonVariant.Primary,
        ...props}, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [loading, setLoading] = useState(isLoading);

    useImperativeHandle(ref, () => buttonRef.current);

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
        <button ref={buttonRef} disabled={loading}
                className={cn("select-none px-3 py-1 transition-colors",variants[variant], className)} {...props}>

            {loading ?
                <svg className="animate-spin h-5 w-5 text-foreground-accent" viewBox="0 0 24 24">
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
})


export default Button;