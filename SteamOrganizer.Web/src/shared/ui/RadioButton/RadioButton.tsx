import React, {Dispatch, memo, ReactElement, ReactNode} from "react";
import {motion} from "framer-motion";
import { StatefulComponentProps, useControlledState} from "@/shared/hooks/useControlledState.ts";

type RadioButtonContentCallback = (item: any, index: number, isActive: boolean, setActive: Dispatch<number>) => ReactNode;
type RadioButtonClickInterceptor = (index: number, setActive: Dispatch<number>) => boolean | void;

/**
 * Props for the internal RadioButtonContent component
 */
interface RadioButtonContentProps {
    /** Render function for radio button content */
    children: RadioButtonContentCallback;

    /** Whether this radio button is currently active */
    isActive: boolean;

    /** Function to set this radio button as active */
    setActive: (index: number) => void;

    /** Index of this radio button in the group */
    index: number;

    /** Data item associated with this radio button */
    item: any;

    /** Custom indicator element to show active state */
    indicator?: ReactElement;

    /** Optional click interceptor for radio buttons */
    clickInterceptor?: RadioButtonClickInterceptor;
}

/**
 * Props for the main RadioButton component
 * @template T Type of items in the generator array
 */
export interface IRadioButtonProps<T> {
    /**
     * Render function for each radio button
     * @param item Current item from generator array
     * @param index Index of current item
     * @param isActive Whether this item is currently selected
     */
    children: RadioButtonContentCallback;
    /** Array of items to generate radio buttons from */
    generator: T[];
    /** Optional custom indicator element for active state */
    indicator?: ReactElement;

    /** Optional click interceptor for radio buttons. Return true if event has been handled */
    clickInterceptor?: RadioButtonClickInterceptor;
}

/**
 * Internal component for rendering individual radio buttons
 * Memoized for preventing unnecessary re-renders
 */
function RadioButtonContent({
                                   children,
                                   isActive,
                                   setActive,
                                   index,
                                   item,
                                   indicator,
                                clickInterceptor
                               }: RadioButtonContentProps) {
    return (
        <button
            onClick={() => {
                if(clickInterceptor && clickInterceptor(index, setActive)) {
                    return;
                }
                setActive(index);
            }}
            className="relative"
        >
            {isActive && (indicator === undefined ?
                <motion.div
                    layoutId="active-pill"
                    style={{borderRadius: 8}}
                    transition={{type: "spring", duration: 0.6}}
                    className="absolute inset-0 bg-secondary"
                /> : indicator
            )}
            <div className="relative z-10">
                {children(item, index, isActive, setActive)}
            </div>
        </button>
    );
}

const MemoizedRadioButtonContent = memo(RadioButtonContent);


/**
 * A customizable radio button group component with animation support
 *
 * @template T Type of items in the generator array
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RadioButton
 *   generator={['Option 1', 'Option 2', 'Option 3']}
 *   initialState={0}
 * >
 *   {(item, index, isActive) => (
 *     <span className={isActive ? 'text-primary' : 'text-secondary'}>
 *       {item}
 *     </span>
 *   )}
 * </RadioButton>
 *
 * // Controlled usage
 * const [selected, setSelected] = useState(0);
 *
 * <RadioButton
 *   generator={options}
 *   state={selected}
 *   setState={setSelected}
 * >
 *   {(item, index, isActive) => (
 *     <CustomOption item={item} active={isActive} />
 *   )}
 * </RadioButton>
 * ```
 */
export function RadioButton<T>({
                                   children,
                                   generator,
                                   state,
                                   initialState,
                                   setState,
                                   onStateChanged,
                                   indicator,
                                   clickInterceptor,
                                   ...props
                               }: StatefulComponentProps<IRadioButtonProps<T>, 'div', number>) {
    const { value, setValue } = useControlledState({
        state,
        initialState,
        setState,
        onStateChanged
    });

    return (
        <div {...props} role="radiogroup">
            {generator.map((item, index) => (
                <MemoizedRadioButtonContent
                    key={index}
                    clickInterceptor={clickInterceptor}
                    indicator={indicator}
                    children={children}
                    isActive={value === index}
                    index={index}
                    item={item}
                    setActive={setValue}
                />
            ))}
        </div>
    );
}
