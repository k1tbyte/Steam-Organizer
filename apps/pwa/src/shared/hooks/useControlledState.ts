import {
    type ComponentProps,
    type Dispatch,
    type JSX,
    type JSXElementConstructor,
    type SetStateAction,
    useCallback,
    useState
} from "react";
import type {HTMLMotionProps, HTMLElements} from "framer-motion";

type JSXComponent = keyof JSX.IntrinsicElements | JSXElementConstructor<any>;
type BindableTarget = object;

function readBoundValue<T>(bindTo?: BindableTarget, bindKey?: string) {
    if (!bindTo || !bindKey) {
        return undefined;
    }

    return (bindTo as Record<string, unknown>)[bindKey] as T | undefined;
}

function writeBoundValue<T>(bindTo: BindableTarget | undefined, bindKey: string | undefined, value: T) {
    if (!bindTo || !bindKey) {
        return;
    }

    (bindTo as Record<string, unknown>)[bindKey] = value;
}

function resolveStateAction<T>(value: SetStateAction<T>, previousValue: T) {
    return typeof value === "function"
        ? (value as (previousValue: T) => T)(previousValue)
        : value;
}

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
    setState?:  Dispatch<SetStateAction<T>>;

    /** Callback fired when state changes in uncontrolled mode */
    onStateChanged?: (value: T) => void;

    bindTo?: BindableTarget;
    bindKey?: string;
}

/**
 * Interface for the controlled state hook result
 * @template T The type of the state value
 */
interface IControlledStateResult<T> {
    /** Current state value */
    value: T;

    /** Function to update the state */
    setValue: Dispatch<SetStateAction<T>>;

    /** Whether the component is in controlled mode */
    isControlled: boolean;
}

/**
 * Type for creating stateful component props
 * Combines base props, controlled state options, and native element props
 *
 * @template T Component HTML type
 * @template S State value type
 */
export type StatefulComponent<
    T extends JSXComponent,
    V
> = IControlledStateOptions<V> & ComponentProps<T>;

/*
* @template T Component HTML type
* @template S State value type
*/
export type StatefulMotionComponent<
    T extends keyof HTMLElements,
    V
> = IControlledStateOptions<V> & HTMLMotionProps<T>;


/**
 * A hook that provides both controlled and uncontrolled state management
 *
 * This hook allows components to work in both controlled and uncontrolled modes,
 * similar to how native HTML form components work.
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
                                          bindTo,
                                          bindKey,
                                          onStateChanged
                                      }: IControlledStateOptions<T>): IControlledStateResult<T> {
    const [internalValue, setInternalValue] = useState<T>(() => {
        return (readBoundValue<T>(bindTo, bindKey) ?? initialState) as T;
    });
    const isControlled = state !== undefined;
    const currentValue = (isControlled ? state : internalValue) as T;

    const setter = useCallback((newValue: SetStateAction<T>) => {
        if (isControlled) {
            const resolvedValue = resolveStateAction(newValue, currentValue);
            writeBoundValue(bindTo, bindKey, resolvedValue);
            setState?.(newValue);
            return;
        }

        setInternalValue((previousValue) => {
            const resolvedValue = resolveStateAction(newValue, previousValue);
            writeBoundValue(bindTo, bindKey, resolvedValue);

            if (resolvedValue !== previousValue) {
                onStateChanged?.(resolvedValue);
            }

            return resolvedValue;
        });
    }, [bindKey, bindTo, currentValue, isControlled, onStateChanged, setState]);

    return {
        value: currentValue,
        setValue: setter,
        isControlled
    };
}