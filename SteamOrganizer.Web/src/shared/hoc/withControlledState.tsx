import {ComponentType, Dispatch, forwardRef} from "react";
import {IControlledStateOptions, useControlledState} from "@/shared/hooks/useControlledState.ts";

/**
 * HOC to wrap a component with controlled state
 * @param WrappedComponent Component to wrap
 * @param defaultValue Default value for the controlled state
 */
export function withControlledState<P extends object, T = any>(
    WrappedComponent: ComponentType<P & { value: T; setValue: Dispatch<T> }>,
    defaultValue?: T
) {
    return forwardRef<any, P & IControlledStateOptions<T>>((props, ref) => {
        const {
            state,
            initialState = defaultValue,
            setState,
            onStateChanged,
            ...componentProps
        } = props;

        const { value, setValue } = useControlledState({
            state,
            initialState,
            setState,
            onStateChanged
        });

        return (
            <WrappedComponent
                {...(componentProps as P)}
                ref={ref}
                value={value}
                setValue={setValue}
            />
        );
    });
}