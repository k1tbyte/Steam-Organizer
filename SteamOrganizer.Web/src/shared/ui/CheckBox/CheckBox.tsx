import {forwardRef, ReactElement} from "react";
import {cn} from "@/shared/lib/utils";
import {withControlledState} from "@/shared/hoc/withControlledState";
import {StatefulComponent} from "@/shared/hooks/useControlledState";

interface ICheckBoxProps extends StatefulComponent<'button', boolean | null>{
    allowIndeterminate?: boolean
    checkedSymbol?: ReactElement
    unCheckedSymbol?: ReactElement
    indeterminateSymbol?: ReactElement
}

const CheckBoxBase = forwardRef<HTMLButtonElement, ICheckBoxProps>(({   className,
                                                                        state,
                                                                        setState,
                                                                        checkedSymbol,
                                                                        unCheckedSymbol,
                                                                        indeterminateSymbol,
                                                                        allowIndeterminate,
                                                                        ...props }, ref) => {
    const toggleCheck = () => {
        setState(prev => {
            return prev === null ? false : prev ? (allowIndeterminate ? null : false) : true;
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
            {state === null ? (indeterminateSymbol || "—") : state ? (checkedSymbol || "✔") : unCheckedSymbol}
        </button>
    )
})

export const CheckBox = withControlledState<ICheckBoxProps, boolean | null>(CheckBoxBase, false);