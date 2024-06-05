import {AnimatePresence, motion} from "framer-motion";
import React, {FC, Key, ReactNode, useState} from "react";
import clsx from "clsx";

interface ITabProps {
    children: ReactNode,
    title: ReactNode,
}

interface ITabPanelProps {
    children: React.ReactElement<ITabProps> | React.ReactElement<ITabProps>[];
    activeKey: Key
}

export const TabPanel: FC<ITabPanelProps> = ({ children, activeKey }) => {
    const [active, setActive] = useState(activeKey)
    let renderContent: ReactNode;

    return (
        <div className="flex items-center flex-col">
            <div className="flex gap-3 mb-10 bg-primary p-2 rounded-lg ">
                {
                    React.Children.map(children, (child) => {
                        let isActive: boolean = false;
                        if (child.key == active) {
                            renderContent = child
                            isActive = true
                        }
                        return (
                            <button key={child.key} onClick={() => setActive(child.key!)}
                                    className={clsx("relative px-3 py-1.5 text-sm font-medium text-black transition-colors",
                                        isActive ? "text-background" : "text-foreground")}>
                                {isActive &&
                                    (<motion.div layoutId="active-pill" style={{borderRadius: 8}}
                                                 transition={{type: "spring", duration: 0.6}}
                                                 className="absolute inset-0 bg-secondary"/>)
                                }
                                <span className="relative z-10">{child.props.title}</span>
                            </button>
                        )
                    })
                }
            </div>

            <div>
                <AnimatePresence>
                    <motion.div initial={{opacity: 0, marginTop: 20}} key={active}
                                animate={{opacity: 1, marginTop: 0}}>
                        {renderContent}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export const Tab: FC<ITabProps> = ({ children}) => (
    <>
        {children}
    </>
)
