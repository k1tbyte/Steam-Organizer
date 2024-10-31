import {CSSProperties, type FC, ReactElement, type ReactNode, useState} from "react";
import {Icon, SvgIcon} from "@/assets";
import { motion } from "framer-motion";
import styles from "./ComboBox.module.css";
import {clsx} from "clsx";

interface IComboBoxProps {
    items: ReactNode[];
    // return true to prevent default selection
    onSelected: (index: number) => true | void;
    allowClear?: boolean;
    placeholder?: string;
    className?: string;
    style?: CSSProperties;
    selectedIndex?: number;
}


export const ComboBox: FC<IComboBoxProps> = ({ onSelected, items, allowClear, placeholder, style, selectedIndex = -1, className }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState(selectedIndex)

    const onSelection = (i: number) => {
        if(!onSelected(i)) {
            setSelected(i)
        }
    }

    return (
        <div className={clsx("bg-accent select-none relative text-foreground",isOpen ? "rounded-t" : "rounded", className)}>
            <div className={styles.header} style={style}
                 onClick={(e) => {
                     setIsOpen(prev => {
                         if (!prev) {
                             setTimeout(() => document.addEventListener("click", () => setIsOpen(false), {once: true}), 50);
                         }
                         return !prev;
                     })
                 }}>
                <div className="flex flex-y-center">
                    {
                        allowClear && selected !== -1 &&
                        <SvgIcon className="mr-2 hover:fill-foreground-accent" size={17} icon={Icon.Close}
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     onSelection(-1);
                                 }}/>
                    }
                    <small className="mt-0.5">
                        {selected === -1 ?
                            placeholder && <span className="text-foreground-muted">{placeholder}</span> :
                            <b>{items[selected]}</b>}
                    </small>
                </div>

                <SvgIcon size={10} icon={Icon.ChevronDown}
                         className={`ml-3 transition-transform${isOpen ? " rotate-180" : ""}`}/>
            </div>

            {
                isOpen &&
                <motion.div initial={{opacity: 0, height: 0}}
                            animate={{opacity: 0.95, height: "auto"}}
                            transition={{duration: 0.2}}
                    className={styles.dropDown}>
                    <ul className={styles.dropList}>
                        {
                            items.map((child: ReactElement, i) => {
                                const isDisabled = child.props?.["aria-disabled"];
                                const click = isDisabled ? null : (() => onSelection(i))
                                return i === selected ? null :
                                    <li key={i}
                                        style={isDisabled ?  {pointerEvents: "none"} : null}
                                        className={styles.listItem} onClick={click}>
                                        {child}
                                    </li>
                            })
                        }
                    </ul>
                </motion.div>
            }
        </div>
    )
}