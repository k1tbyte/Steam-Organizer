import {forwardRef, type ReactNode} from "react";
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
            <div className="flex justify-between mb-0.5 ml-0.5 relative gap-3">
                <p className="text-chip text-[13px] font-semibold text-nowrap">{title}</p>
                <div className="flex-y-center overflow-hidden max-w-[70%] opacity-90">
                    <span ref={ref} validation-text=""
                          className="text-[11px] text-foreground-accent  overflow-hidden text-ellipsis hover:py-0.5 bg-danger rounded-sm px-1 hover:absolute right-0 bottom-0 hover:text-wrap text-nowrap cursor-default"/>
                </div>
            </div>

            <div className="flex mb-1">
                <div className="grad-purple w-[35px] h-[35px]
                                rounded-xm flex-shrink-0 flex items-center justify-center mr-2.5">
                    {icon}
                </div>
                {children}
            </div>
        </div>
    )
    })

export default InputWrapper;