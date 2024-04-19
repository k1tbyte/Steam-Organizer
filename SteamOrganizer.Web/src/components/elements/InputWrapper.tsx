import {forwardRef, ReactNode} from "react";
import clsx from "clsx";

interface IInputWrapperProps {
    className?: string,
    title: string,
    children: ReactNode,
    icon: ReactNode
}

const InputWrapper = forwardRef<HTMLSpanElement,IInputWrapperProps>(
    ({className,title, children, icon}, ref) => {

    return  (
        <div className={clsx(className)}>
            <div className="flex justify-between items-center mb-1 relative">
                <p className="text-pr-5 text-sm font-semibold ml-[1px]">{title}</p>
                <span ref={ref} className="text-[11px] bg-red-500 text-fg-3 py-0.5 opacity-90 px-1
                                 rounded-sm absolute right-0 bottom-0 max-w-[70%] text-ellipsis text-nowrap
                                 overflow-hidden hover:text-wrap empty:opacity-0 empty:p-0 transition-opacity pointer-events-none"/>
            </div>

            <div className="flex mb-1">
                <div className="bg-gradient-to-br from-stroke-2 to-stroke-3 w-[35px]
                                rounded-small p-[7px] flex-shrink-0 flex items-center justify-center mr-2.5">
                    {icon}
                </div>
                {children}
            </div>
        </div>
    )
})

export default InputWrapper;