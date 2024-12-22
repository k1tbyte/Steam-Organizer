import {cloneElement, FC, forwardRef, ReactElement, type ReactNode, useImperativeHandle, useRef} from "react";
import clsx from "clsx";
import Input, {IInputProps} from "@/shared/ui/Input.tsx";
import {CheckBox} from "@/shared/ui/CheckBox/CheckBox.tsx";
import {config, delayedSaveConfig} from "@/store/config.ts";

export const enum ETitlePosition {
    Top,
    Inline
}

interface IFieldWrapperProps {
    className?: string,
    title: string | ReactElement<HTMLSpanElement>,
    children: ReactNode,
    icon: ReactNode,
    titleChildren?: ReactElement,
    titlePos?: ETitlePosition

}

interface IInputWrapperProps {
    title: string | ReactElement<HTMLSpanElement>,
    icon: ReactElement,
    children: ReactElement,
    className?: string,
}

export const FieldWrapper:FC<IFieldWrapperProps> = ({className,title, titlePos, children, icon, titleChildren}) => {
    return  (
        <div className={className}>
            {titlePos !== ETitlePosition.Inline &&
                <div className="flex justify-between mb-0.5 ml-0.5 relative gap-3">
                    <p className="text-chip text-[13px] font-semibold text-nowrap">{title}</p>
                    {titleChildren}
                </div>
            }

            <div className="flex mb-1">
                <div className="grad-purple w-[35px] h-[35px] text-foreground-accent
                                rounded-xm flex-shrink-0 flex items-center justify-center mr-2.5">
                    {icon}
                </div>
                { titlePos === ETitlePosition.Inline ?
                    <div className="justify-between flex-y-center w-full text-foreground text-xs">
                        {title}
                        {children}
                    </div>
                    : children
                }

            </div>
        </div>
    )
}

export const InputValidationWrapper = forwardRef<HTMLSpanElement, IInputWrapperProps>(
    ({title, icon, className, children }, forwardedRef) => {

        const ref = useRef<HTMLSpanElement>(null);
        useImperativeHandle(forwardedRef, () => ref.current as HTMLSpanElement);

        const onValidate = (value: string | undefined) => ref.current.innerText = value || "";

        const validationInfo =
            <div className="flex-y-center overflow-hidden max-w-[70%] opacity-90">
                <span validation-text="" ref={ref}
                      className="text-[11px] text-foreground-accent  overflow-hidden text-ellipsis hover:py-0.5 bg-danger rounded-sm px-1 hover:absolute right-0 bottom-0 hover:text-wrap text-nowrap cursor-default"/>
            </div>

        return (
            <FieldWrapper title={title}
                          className={className}
                          titleChildren={validationInfo}
                          icon={icon}>
                {cloneElement(children, { onValidate: onValidate })}
            </FieldWrapper>
        )
    })