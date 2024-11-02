import React, {createContext, type FC, type ReactNode, useEffect, useRef, useState} from "react";
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
import {openSettings} from "@/pages/Modals/Settings.tsx";
import {type ObservableProxy} from "@/lib/observer/observableProxy.ts";
import {type Account} from "@/entity/account.ts";
import {accounts, exportAccounts, importAccounts} from "@/store/accounts.ts";
import {AnimatePresence, motion} from "framer-motion";
import {ExportData} from "@/pages/Modals/ExportData.tsx";
import {formatFileDate} from "@/lib/utils.ts";
import {Tooltip} from "@/components/primitives/Popup.tsx";
import {verifyVersion} from "@/services/cryptography.ts";
import {DecryptionPopup} from "@/pages/Modals/Authentication.tsx";

interface IAccountsNavProps {
    children: ReactNode;
    proxy: ObservableProxy<Account[]>;
}

export const AccountsContext = createContext<IDraggableContext>(undefined!)

const AccountsNav: FC<IAccountsNavProps> = ({ children, proxy }) => {
    const [expanded, setExpanded] = useState(false);
    const [isDragging, setDragging] = useState(false);
    const [isDragState, setDragState] = useState(false);
    const [open, setOpen] = useState(false);
    const infoRef = useRef<IDraggableInfo>({});
    const searchRef = useRef<HTMLInputElement>(null!);
    const fileInputRef = useRef<HTMLInputElement>(null!);

    useEffect(() => {
        const filter = (data: Account[]) => {
            if(!searchRef.current.value) return data;
            return data.filter(acc =>
                acc.nickname.toUpperCase().includes(searchRef.current.value.toUpperCase())
            )
        }

        const onInput = () => proxy.proxyCallback(accounts.value);

        proxy.addMiddleware(filter);
        searchRef.current.addEventListener("input", onInput);

        return () => {
            proxy.removeMiddleware(filter);
            searchRef.current?.removeEventListener("input", onInput);
        }
    }, []);


    const addClicked = () => {
        setExpanded(false)
        if(!config.steamApiKey) {
            toast.open({
                body: "Steam API key not specified. Do this in settings",
                variant: ToastVariant.Warning,
                clickAction: openSettings
            })
            return;
        }
        modal.open({
            title: "New account",
            body: <AddAccount/>
        })
    }

    const exportClicked = () => {
        modal.open({
            body: <ExportData getData={() => [`Database Backup ${formatFileDate()}`, accounts.value]}
                              encryptedExtension="sodb"/>,
            title: "Export database"
        })
    }

    const importFileSelected = (e:   React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files?.length) return;

        const reader = new FileReader();
        reader.onload = e => {
            if(!verifyVersion(e.target.result as ArrayBuffer)) {
                toast.open({
                    body: "Failed importing database. File corrupted or incompatible",
                    variant: ToastVariant.Error
                })
                return
            }

            modal.open({
                body: <DecryptionPopup decryptData={e.target.result as ArrayBuffer}
                                       info={`Enter password to import database${accounts.value.length ? ". Warning! Your current database will be lost" : ""}`}
                                       onSuccess={(_, d) => importAccounts(d, true) }/>,
                title: "Import database"
            })
        };

        reader.onerror = () => {
            toast.open({
                body: "Failed importing database, cannot read file",
                variant: ToastVariant.Error
            })
        }

        reader.readAsArrayBuffer(e.target.files[0]);
    }

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
                        <Input className="rounded-lg pr-24 h-full bg-primary placeholder:font-semibold"
                               ref={searchRef}
                               maxLength={60} placeholder="Search in accounts"/>
                        <div className={styles.searchPanel}>
                            <SvgIcon icon={Icon.ChevronDown} size={15}
                                     className={clsx("mr-2 text-foreground transition-transform sm:hidden", expanded && "rotate-180")}
                                     onClick={() => setExpanded(prev => !prev)}/>

                            <div className={styles.iconWrapper}>
                                <SvgIcon icon={Icon.Magnifier} fill={Gradients.LightBlue} size={16}/>
                            </div>
                        </div>
                    </div>
                    <div className={styles.btnsPanel}>
                        <Tooltip message="Update accounts info">
                            <button className="px-3">
                                <SvgIcon icon={Icon.DatabaseUpdate} size={20} fill={Gradients.LightBlue}/>
                            </button>
                        </Tooltip>
                        <div className={styles.separator}/>
                        <Tooltip message="Export accounts database">
                            <button className="px-3" onClick={exportClicked}>
                                <SvgIcon icon={Icon.DatabaseExport} size={20} fill={Gradients.LightBlue}/>
                            </button>
                        </Tooltip>
                        <div className={styles.separator}/>
                        <Tooltip message="Import accounts database">
                            <button className="px-3" onClick={() => {
                                fileInputRef.current.value = "";
                                fileInputRef.current.click();
                            }}>
                                <SvgIcon icon={Icon.DatabaseImport} size={20} fill={Gradients.LightBlue}/>
                            </button>
                        </Tooltip>
                        <div className={styles.separator}/>
                        <Tooltip message="Add account">
                            <button className="px-3" onClick={addClicked}>
                                <SvgIcon icon={Icon.Plus} size={20} fill={Gradients.LightBlue}/>
                            </button>
                        </Tooltip>
                        <input ref={fileInputRef} type="file"
                               onChange={importFileSelected}
                               style={{display: "none"}}
                               accept=".sodb"/>
                    </div>
                </div>
            </nav>
            {children}
        </AccountsContext.Provider>
    )
}

export default React.memo(AccountsNav);