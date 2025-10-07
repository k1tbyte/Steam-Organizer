import {ComponentType, Dispatch, forwardRef, SetStateAction} from "react";
import {IControlledStateOptions, useControlledState} from "@/shared/hooks/useControlledState";

/**
 * HOC to wrap a component with controlled state
 * @param WrappedComponent Component to wrap
 * @param defaultValue Default value for the controlled state
 */
export function withControlledState<P extends object, T>(
    WrappedComponent: ComponentType<P & { state: T; setState:  Dispatch<SetStateAction<T>> }>,
    defaultValue?: T
) {
    return forwardRef<any, P & IControlledStateOptions<T>>((props, ref) => {
        const {
            state,
            initialState = defaultValue,
            bindTo,
            bindKey,
            setState,
            onStateChanged,
            ...componentProps
        } = props;

        const { value, setValue } = useControlledState({
            state,
            initialState,
            setState,
            bindTo,
            bindKey,
            onStateChanged
        });

        return (
            <WrappedComponent
                {...(componentProps as P)}
                ref={ref}
                state={value}
                setState={setValue}
            />
        );
    });
}