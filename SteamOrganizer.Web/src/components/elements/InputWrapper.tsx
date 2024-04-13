import {FC, ReactNode} from "react";
import clsx from "clsx";

interface IInputWrapperProps {
    className?: string,
    title: string,
    children: ReactNode,
    icon: ReactNode
}

const InputWrapper: FC<IInputWrapperProps> = ({className,title, children, icon}) => {
    return  (
        <div className={clsx(className)}>
            <p className="text-pr-5 text-[14px] font-semibold ml-[1px] mb-1">{title}</p>
            <div className="flex">
                <div className="bg-gradient-to-br from-stroke-2 to-stroke-3 w-[35px]
                                rounded-small p-[7px] flex-shrink-0 flex items-center justify-center mr-2.5">
                    {icon}
                </div>
                {children}
            </div>

        </div>
    )
}

export default InputWrapper;