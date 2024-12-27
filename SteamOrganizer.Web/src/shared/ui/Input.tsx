import {type ChangeEvent, forwardRef, type InputHTMLAttributes, type CompositionEvent } from "react";
import {cn} from "@/shared/lib/utils";
import {type TypeInputValidator} from "@/shared/hooks/useFormValidation";
import {type IBindable} from "@/shared/types/IBindable";

export const enum EPropertyChangedTrigger {
    None,
    OnLostFocus,
    Reactive
}

export interface IInputProps extends InputHTMLAttributes<HTMLInputElement>, IBindable {
    className?: string,
    filter?: RegExp,
    onValidate?: (value: string) => void,
    validator?: TypeInputValidator,
    converter?: (value: string) => any,
    trigger?: EPropertyChangedTrigger,
}


const  Input = forwardRef<HTMLInputElement, IInputProps>((
    { className,bindTo, bindKey, onValidate, validator, onChanged, filter, converter, trigger = EPropertyChangedTrigger.None, ...props}, forwardedRef) => {

    const onChanging = (value: string) => {
        if(bindTo && bindKey && bindTo[bindKey] !== (converter ? (value = converter(value)) : value)) {
            bindTo[bindKey] = value
            onChanged?.()
        }
    }

    const isValid = (value: string) => {
        if(!validator) {
            return true;
        }

        const result = validator(value)
        onValidate?.(result)
        return !result
    }

    if (validator) {
        props.onInput = (e: ChangeEvent<HTMLInputElement>) => {
            if(isValid(e.target.value) && trigger === EPropertyChangedTrigger.Reactive) {
                onChanging(e.target.value)
            }
        }
    }

    if(trigger === EPropertyChangedTrigger.OnLostFocus) {
        props.onBlur = (e) => {
            if(isValid(e.target.value)) {
                onChanging(e.target.value)
            }
        }
    }

    return (
        <input type="text" ref={forwardedRef} defaultValue={bindTo?.[bindKey]} {...props}
               onBeforeInput={filter ? (e: CompositionEvent<HTMLInputElement>) => {
                   if(!filter.test(e.data)) {
                       e.preventDefault()
                   }
               } : undefined}
               className={cn("w-full placeholder-foreground-muted px-2.5 outline-0 outline-none rounded-sm text-foreground text-2xs focus:placeholder:opacity-50 placeholder:duration-300 placeholder:transition-opacity bg-accent h-[35px]", className)}/>
    )
})

export default Input;