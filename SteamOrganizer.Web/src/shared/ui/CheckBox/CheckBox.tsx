import {forwardRef, type HTMLAttributes, useState} from "react";
import {cn} from "@/shared/lib/utils.ts";
import {IBindable} from "@/shared/types/IBindable.ts";

interface ICheckBoxProps extends HTMLAttributes<HTMLButtonElement>, IBindable {
    allowIndeterminate?: boolean
}

export const CheckBox = forwardRef<HTMLButtonElement, ICheckBoxProps>(({ className, allowIndeterminate,bindKey, onChanged, bindTo, ...props }, ref) => {
    const [checked, setChecked] = useState<boolean | null>(bindTo && bindKey ? bindTo[bindKey] : false);

    const toggleCheck = () => {
        setChecked(prev => {
            const value = prev === null ? false : prev ? (allowIndeterminate ? null : false) : true;
            bindTo && bindKey && (bindTo[bindKey] = value) && onChanged?.();
            return value;
        });
    };

    return (
        <button ref={ref} tabIndex={0}
                className={cn(
                    "rounded-md bg-background flex-center hover:text-foreground-accent focus:focus-shadow select-none cursor-pointer text-foreground text-xs transition-colors",
                    className)
                }
                style={{width: 25, height: 25}} {...props}
                onClick={toggleCheck}>
            {checked === null ? "—" : checked && "✔"}
        </button>
    )
})