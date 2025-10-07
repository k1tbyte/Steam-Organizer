import React, {Dispatch, memo, ReactElement, ReactNode, SetStateAction} from "react";
import {motion} from "framer-motion";
import { StatefulComponent, useControlledState} from "@/shared/hooks/useControlledState";
import styles from "./RadioButton.module.css";
import clsx from "clsx";
import {withControlledState} from "@/shared/hoc/withControlledState";

type RadioButtonContentCallback = (item: any, index: number, isActive: boolean, setActive: Dispatch<number>) => ReactNode;
type RadioButtonClickInterceptor = (index: number, setActive: Dispatch<number>) => boolean | void;

/**
 * Props for the internal RadioButtonContent component
 */
interface RadioButtonContentProps {
    /** Render function for radio button content */
    children?: RadioButtonContentCallback;

    /** Whether this radio button is currently active */
    isActive: boolean;

    /** Function to set this radio button as active */
    setActive: Dispatch<SetStateAction<number>>;

    /** Index of this radio button in the group */
    index: number;

    /** Data item associated with this radio button */
    item: any;

    /** Custom indicator element to show active state */
    indicator?: ReactElement;

    /** Optional click interceptor for radio buttons */
    clickInterceptor?: RadioButtonClickInterceptor;
    layoutId?: string;
}

/**
 * Props for the main RadioButton component
 * @template T Type of items in the generator array
 */
export interface IRadioButtonProps<T> extends Omit<StatefulComponent<'div', number>, 'children'>{
    /**
     * Render function for each radio button
     * @param item Current item from generator array
     * @param index Index of current item
     * @param isActive Whether this item is currently selected
     */
    children?: RadioButtonContentCallback;
    /** Array of items to generate radio buttons from */
    generator: T[];
    /** Optional custom indicator element for active state */
    indicator?: ReactElement;

    /** Optional click interceptor for radio buttons. Return true if event has been handled */
    clickInterceptor?: RadioButtonClickInterceptor;
    layoutId?: string;
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
                                layoutId,
                                clickInterceptor
                               }: RadioButtonContentProps) {
    return (
        <button
            onClick={() => {
                if(clickInterceptor && clickInterceptor(index, setActive)) {
                    return;
                }
                setActive(index);
            }}>
            {isActive && (indicator === undefined ?
                <motion.div
                    layoutId={layoutId ?? "radio-indicator"}
                    style={{borderRadius: 8}}
                    transition={{type: "spring", duration: 0.6}}
                    className={styles.indicator}
                /> : indicator
            )}
            <div className={clsx(children ? styles.btnBase : styles.btn, isActive && styles.active)}>
                {children ? children(item, index, isActive, setActive) : item}
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
function RadioButtonBase<T>({
                                   children,
                                   generator,
                                   setState,
                                   state,
                                   indicator,
                                   clickInterceptor,
                                   layoutId,
                                   className,
                                   ...props
                               }: IRadioButtonProps<T>) {

    return (
        <div className={clsx(styles.group, className)} {...props} role="radiogroup">
            {generator.map((item, index) => (
                <MemoizedRadioButtonContent
                    key={index}
                    clickInterceptor={clickInterceptor}
                    indicator={indicator}
                    children={children}
                    layoutId={layoutId}
                    isActive={state === index}
                    index={index}
                    item={item}
                    setActive={setState}
                />
            ))}
        </div>
    );
}

export const RadioButton = withControlledState(RadioButtonBase, 0);
