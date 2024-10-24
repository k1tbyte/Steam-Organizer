import React, {createContext, type FC, type ReactNode, useRef, useState} from "react";
import clsx from "clsx";
import styles from "./AccountsNav.module.pcss";
import Input from "@/components/primitives/Input.tsx";
import {Gradients, Icon, SvgIcon} from "@/assets";
import {modal} from "@/components/primitives/Modal.tsx";
import {AddAccount} from "@/pages/Modals/AddAccount.tsx";
import {config} from "@/store/config.ts";
import {toast, ToastVariant} from "@/components/primitives/Toast.tsx";
import {ToggleButton} from "@/components/primitives/ToggleButton.tsx";
import {IDraggableContext, IDraggableInfo} from "@/components/primitives/Draggable.tsx";

interface IAccountsNavProps {
    children: ReactNode;
}

export const AccountsContext = createContext<IDraggableContext>(undefined!)

const AccountsNav: FC<IAccountsNavProps> = ({ children }) => {
    const [expanded, setExpanded] = useState(false);
    const [isDragging, setDragging] = useState(false);
    const [isDragState, setDragState] = useState(false);
    const infoRef = useRef<IDraggableInfo>({});

    return (
        <AccountsContext.Provider value={ { isEnabled: isDragState, isDragging: isDragging, setIsDragging: setDragging, infoRef: infoRef } }>
            <nav className="w-full mt-[7px] flex-shrink-0 h-[40px] relative">
                <div className={clsx(styles.wrapper, expanded && "h-[110px]")}>
                    <ToggleButton className={styles.editButton}
                                  isEnabled={isDragState} setEnabled={(e) => {
                        setDragState(e)
                        setExpanded(false)
                    }}
                                  onContent={<SvgIcon icon={Icon.CheckSquareOutline} className="text-foreground-accent"
                                                      size={21}/>}
                                  offContent={<SvgIcon icon={Icon.EditSquareOutline} size={21}/>}/>
                    <div className="w-full flex-center relative -order-1 z-20 h-[40px]">
                        <div className={clsx(styles.searchOverlay, expanded || "h-0")}></div>
                        <Input className="rounded-lg pr-24 h-full bg-primary placeholder:font-semibold" maxLength={60} placeholder="Search in accounts"/>
                        <div className={styles.searchPanel}>
                            <SvgIcon icon={Icon.ChevronDown} size={15}
                                     className={clsx("mr-2 text-foreground transition-transform sm:hidden", expanded && "rotate-180")}
                                     onClick={() => setExpanded(prev => !prev)}/>

                            <div className={styles.iconWrapper}>
                                <SvgIcon icon={Icon.Magnifier} fill={Gradients.LightBlue} size={16}/>
                            </div>
                        </div>
                    </div>
                    <button className={styles.addButton} onClick={() => {
                        setExpanded(false)
                        if(!config.steamApiKey) {
                            toast.open({ body: "Steam API key not specified. Do this in settings",
                                variant: ToastVariant.Warning })
                            return;
                        }
                        modal.open({
                            title: "New account",
                            body: <AddAccount/>
                        })
                    }}>
                        <SvgIcon icon={Icon.Plus} size={20} fill={Gradients.LightBlue}/>
                    </button>
                </div>
            </nav>
            {children}
        </AccountsContext.Provider>
    )
}

export default React.memo(AccountsNav);