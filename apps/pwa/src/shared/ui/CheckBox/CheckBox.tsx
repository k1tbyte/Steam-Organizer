import {type ReactElement} from "react";
import {cn} from "@/shared/lib/utils";
import {StatefulComponent, useControlledState} from "@/shared/hooks/useControlledState";

interface ICheckBoxProps extends StatefulComponent<'button', boolean | null>{
    allowIndeterminate?: boolean
    checkedSymbol?: ReactElement
    unCheckedSymbol?: ReactElement
    indeterminateSymbol?: ReactElement
}

export function CheckBox({
    className,
    state,
    setState,
    initialState = false,
    bindTo,
    bindKey,
    onStateChanged,
    checkedSymbol,
    unCheckedSymbol,
    indeterminateSymbol,
    allowIndeterminate,
    onClick,
    type = "button",
    ...props
}: ICheckBoxProps) {
    const { value, setValue } = useControlledState<boolean | null>({
        state,
        initialState,
        setState,
        bindTo,
        bindKey,
        onStateChanged
    });

    const toggleCheck = (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (event.defaultPrevented) {
            return;
        }

        setValue((prev) => {
            return prev === null ? false : prev ? (allowIndeterminate ? null : false) : true;
        });
    };

    return (
        <button type={type} role="checkbox" aria-checked={value === null ? "mixed" : value}
                className={cn(
                    "rounded-md bg-background flex-center hover:text-foreground-accent focus:focus-shadow select-none cursor-pointer text-foreground text-xs transition-colors",
                    className)
                }
                style={{width: 25, height: 25}} {...props}
                onClick={toggleCheck}>
            {value === null ? (indeterminateSymbol || "—") : value ? (checkedSymbol || "✔") : unCheckedSymbol}
        </button>
    )
}