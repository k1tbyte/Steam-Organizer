import {AnimatePresence, type HTMLMotionProps, motion} from "framer-motion";
import React, {Dispatch, forwardRef, type ReactElement, type ReactNode} from "react";
import { type StatefulComponentProps } from "@/shared/hooks/useControlledState.ts";
import {withControlledState} from "@/shared/hoc/withControlledState.tsx";

interface ITabsProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode[] | ((index: number, setActive: Dispatch<number>) => ReactNode) ;
    navigator: ReactElement<StatefulComponentProps<any, any, number>>;
    activeTab?: number;
}

const BaseTabs = forwardRef<HTMLDivElement, ITabsProps & { value: number; setValue: Dispatch<number> }>(
    ({ navigator, children, value, setValue, ...props }, ref) => {
        return (
            <>
            {React.cloneElement(navigator, {
                setState: setValue,
                state: value
            } satisfies StatefulComponentProps<object, any, number>)}

                <AnimatePresence mode="wait">
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={value}
                        {...props}
                    >
                        {typeof children === "function" ? children(value, setValue) : children[value]}
                    </motion.div>
                </AnimatePresence>
            </>
        );
    }
);

export const Tabs = withControlledState<ITabsProps, number>(BaseTabs, 0);