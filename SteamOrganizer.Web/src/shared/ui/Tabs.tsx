import {AnimatePresence, motion} from "framer-motion";
import React, {Dispatch, forwardRef, type ReactElement, type ReactNode} from "react";
import {type StatefulComponent, StatefulMotionComponent} from "@/shared/hooks/useControlledState";
import {withControlledState} from "@/shared/hoc/withControlledState";

interface ITabsProps extends Omit<StatefulMotionComponent<'div', number>, "children"> {
    children: ReactNode[] | ((index: number, setActive: Dispatch<number>) => ReactNode) ;
    navigator: ReactElement<StatefulComponent<any, number>>;
}

const BaseTabs = forwardRef<HTMLDivElement, ITabsProps>(
    ({ navigator, children, state, setState, ...props }, ref) => {
        return (
            <>
            {React.cloneElement(navigator, {
                setState: setState,
                state: state
            } satisfies StatefulComponent<any, number>)}

                <AnimatePresence mode="wait">
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={state}
                        {...props}
                    >
                        {typeof children === "function" ? children(state, setState) : children[state]}
                    </motion.div>
                </AnimatePresence>
            </>
        );
    }
);

export const Tabs = withControlledState<ITabsProps, number>(BaseTabs, 0);