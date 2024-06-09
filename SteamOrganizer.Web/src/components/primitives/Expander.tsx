import {FC, ReactElement, ReactNode, useState} from "react";
import {cn} from "@/lib/utils.ts";
import {AnimatePresence, motion} from "framer-motion";
import clsx from "clsx";
import {Icon, SvgIcon} from "@/assets";


interface IExpanderProps {
    children: ReactNode;
    title: string;
    className?: string;
    isExpanded?: boolean;
    icon?: ReactElement;
}

export const Expander: FC<IExpanderProps> = ({ className, icon, title,
                                                 children, isExpanded = true }) => {
    const [expanded, setExpanded] = useState(isExpanded)

    return (
        <div className={cn("rounded-lg text-foreground", className)}>
            <div className={"border-background p-4 flex items-center justify-between" + (expanded ? " border-b-4" : "")}>
                <div className="flex-y-center gap-3">
                    {icon &&
                        <div className="w-11 h-11 grad-chip rounded-xl flex-center">
                            {icon}
                        </div>
                    }
                    <span className="letter-space text-md font-bold">{title}</span>
                </div>
                <SvgIcon icon={Icon.ChevronDown} size={22} role="button"
                               className={clsx("btn-hover transition-transform",{"rotate-90": !expanded })}
                               onClick={() => setExpanded(prev => !prev)}/>
            </div>
            <AnimatePresence>
                <motion.div initial={{ height: 0}}
                            exit={{ height: 0}}
                            transition={ { duration: 0.1, mass: 1 } }
                            /* @ts-ignore*/
                            key={expanded} className="overflow-hidden"
                            animate={{ height: "auto"}}>
                    { expanded && children}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}