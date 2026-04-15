import {AnimatePresence, motion} from "framer-motion";
import React, {type Dispatch, type ReactElement, type ReactNode, type SetStateAction} from "react";
import {type StatefulComponent, StatefulMotionComponent, useControlledState} from "@/shared/hooks/useControlledState";

interface ITabsProps extends Omit<StatefulMotionComponent<'div', number>, "children"> {
    children: ReactNode[] | ((index: number, setActive: Dispatch<SetStateAction<number>>) => ReactNode) ;
    navigator: ReactElement<StatefulComponent<any, number>>;
}

export function Tabs({
    navigator,
    children,
    state,
    setState,
    initialState = 0,
    bindTo,
    bindKey,
    onStateChanged,
    ...props
}: ITabsProps) {
    const { value: activeTab, setValue: setActiveTab } = useControlledState<number>({
        state,
        initialState,
        setState,
        bindTo,
        bindKey,
        onStateChanged
    });

    return (
        <>
            {React.cloneElement(navigator, {
                setState: setActiveTab,
                state: activeTab
            } satisfies StatefulComponent<any, number>)}

            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={activeTab}
                    {...props}
                >
                    {typeof children === "function" ? children(activeTab, setActiveTab) : children[activeTab]}
                </motion.div>
            </AnimatePresence>
        </>
    );
}