import {forwardRef, InputHTMLAttributes, useImperativeHandle, useRef} from "react";
import {cn} from "@/lib/utils.ts";
import {TypeInputValidator} from "@/hooks/useFormValidation.ts";
import {config} from "@/store/config.ts";

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string,
    bindTo?: object,
    bindKey?: string,
    filter?: RegExp,
    onValidate?: (value: string) => void,
    validator?: TypeInputValidator,
    converter?: (value: string) => any,

    // Fired when bindable value changed and new value is different from the old one
    onChanged?: () => void
}

const  Input = forwardRef<HTMLInputElement, IInputProps>((
    { className,bindTo, bindKey, onValidate, validator, onChanged, filter, converter, ...props}, forwardedRef) => {
    const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.onInput?.(e)

        if (validator) {
            const result = validator(e.target.value)
            onValidate?.(result)

            if(result) {
                return;
            }
        }


        if(bindTo && bindKey && bindTo[bindKey] !== (converter ? converter(e.target.value) : e.target.value)) {
            bindTo[bindKey] = e.target.value
            onChanged?.()
        }
    }

    return (
        <input type="text" ref={forwardedRef} defaultValue={bindTo?.[bindKey]} {...props} onInput={onInput}
               onBeforeInput={filter ? (e: React.CompositionEvent<HTMLInputElement>) => {
                   if(!filter.test(e.data)) {
                       e.preventDefault()
                   }
               } : undefined}
               className={cn("w-full placeholder-foreground-muted px-2.5 outline-0 outline-none rounded-sm text-foreground text-2xs focus:placeholder:opacity-50 placeholder:duration-300 placeholder:transition-opacity bg-accent h-[35px]", className)}/>
    )
})

export default Input;