import {AnimatePresence, motion} from "framer-motion";
import React, {FC, forwardRef, Key, ReactNode, useState} from "react";
import {cn} from "@/lib/utils.ts";

interface ITabProps {
    children: ReactNode,
    title: ReactNode | ((active: boolean) => ReactNode),
}

interface ITabPanelProps {
    children: React.ReactElement<ITabProps> | React.ReactElement<ITabProps>[];
    activeKey: Key;
    className?: string;
    indicator?: ReactNode
}

export const TabPanel: FC<ITabPanelProps> = forwardRef<HTMLDivElement,ITabPanelProps> (
    ({ children, activeKey, className, indicator, ...props }, ref) => {
    const [active, setActive] = useState(activeKey)
    let renderContent: ReactNode;

    return (
        <div className="flex-x-center flex-col" ref={ref}>
            <div className={cn("flex-x-center w-full mb-5 bg-primary rounded-lg",className)}>
                {
                    React.Children.map(children, (child) => {
                        let isActive: boolean = false;
                        if (child.key == active) {
                            renderContent = child
                            isActive = true
                        }
                        return (
                            <button key={child.key} onClick={() => setActive(child.key!)}
                                    className="relative text-sm text-foreground">
                                {isActive &&
                                    (indicator ??
                                        <motion.div layoutId="active-pill" style={{borderRadius: 8}}
                                                    transition={{type: "spring", duration: 0.6}}
                                                    className="absolute inset-0 bg-secondary"/>
                                    )
                                }
                                <span className="relative z-10">
                                    {typeof child.props.title === 'function' ?
                                        child.props.title(isActive) : child.props.title}
                                </span>
                            </button>
                        )
                    })
                }
            </div>

            <div className="w-full" {...props}>
                <AnimatePresence>
                    <motion.div initial={{opacity: 0, marginTop: 20}} key={active}
                                animate={{opacity: 1, marginTop: 0}}>
                        {renderContent}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
})

export const Tab: FC<ITabProps> = ({ children}) => children
