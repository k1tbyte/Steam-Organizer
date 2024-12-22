import {type ComponentProps, type Dispatch, FC, type JSXElementConstructor, useCallback, useState} from "react";

type JSXComponent = keyof JSX.IntrinsicElements | JSXElementConstructor<any>;

/**
 * Interface for controlled state options
 * @template T The type of the state value
 */
export interface IControlledStateOptions<T> {
    /** Current state value for controlled mode */
    state?: T;

    /** Initial state value for uncontrolled mode */
    initialState?: T;

    /** State setter function for controlled mode */
    setState?: Dispatch<T>;

    /** Callback fired when state changes in uncontrolled mode */
    onStateChanged?: (value: T) => void;
}

/**
 * Interface for the controlled state hook result
 * @template T The type of the state value
 */
interface IControlledStateResult<T> {
    /** Current state value */
    value: T;

    /** Function to update the state */
    setValue: Dispatch<T>;

    /** Whether the component is in controlled mode */
    isControlled: boolean;
}

/**
 * Type for creating stateful component props
 * Combines base props, controlled state options, and native element props
 *
 * @template P Base component props
 * @template T Component type
 * @template V State value type
 */
export type StatefulComponentProps<
    P extends object,
    T extends JSXComponent,
    V
> = P & IControlledStateOptions<V> & Omit<ComponentProps<T>, keyof P>;

/**
 * Type for creating stateful functional components
 *
 * @template P Base component props
 * @template T Component type
 * @template V State value type
 */
export type StatefulComponent<
    P extends object,
    T extends JSXComponent,
    V
> = FC<StatefulComponentProps<P, T, V>>;

/**
 * A hook that provides both controlled and uncontrolled state management
 *
 * This hook allows components to work in both controlled and uncontrolled modes,
 * similar to how native HTML form elements work.
 *
 * @template T The type of the state value
 *
 * @param options Configuration options for the state management
 * @returns An object containing the current value, setter function, and control mode
 *
 * @example
 * ```tsx
 * // Uncontrolled usage
 * function UncontrolledExample() {
 *   const { value, setValue } = useControlledState({
 *     initialState: false,
 *     onStateChanged: (newValue) => console.log('State changed:', newValue)
 *   });
 *
 *   return <button onClick={() => setValue(prev => !prev)}>Toggle</button>;
 * }
 *
 * // Controlled usage
 * function ControlledExample() {
 *   const [state, setState] = useState(false);
 *
 *   const { } = useControlledState({
 *     state,
 *     setState,
 *   });
 *
 *   return <button onClick={() => setState(!state)}>Toggle</button>;
 * }
 * ```
 */
export function useControlledState<T>({
                                          state,
                                          initialState,
                                          setState,
                                          onStateChanged
                                      }: IControlledStateOptions<T>): IControlledStateResult<T> {
    const [internalValue, setInternalValue] = useState<T>(initialState);
    const isControlled = state !== undefined;
    const currentValue = isControlled ? state : internalValue;

    const setter = useCallback((newValue: T) => {
        if (isControlled) {
            setState?.(newValue);
            return;
        }

        setInternalValue(newValue);
        onStateChanged?.(newValue);
    }, [isControlled, setState, onStateChanged]);

    return {
        value: currentValue,
        setValue: setter,
        isControlled
    };
}