import {ButtonHTMLAttributes, forwardRef} from "react";
import clsx from "clsx";

interface ILoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string,
    loadingTitle: string,
    defaultTitle: string,
}

const LoadingButton = forwardRef<HTMLButtonElement,ILoadingButtonProps> (
    ({ className , loadingTitle, defaultTitle, ...props }, ref) => {
    return (
        <button ref={ref} type="button"
                className={clsx('btn-primary text-def min-h-7 bg-pr-4 text-pr-3 group enabled:hover:text-fg-3 transition-colors ', className)} {...props}>
            <svg className="group-enabled:hidden animate-spin -ml-1 mr-3 h-5 w-5 text-fg-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" fill="transparent"
                        strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="group-disabled:hidden select-none">{defaultTitle}</span>
            <span className="group-enabled:hidden select-none">{loadingTitle}</span>
        </button>
    )
    })

export default LoadingButton;