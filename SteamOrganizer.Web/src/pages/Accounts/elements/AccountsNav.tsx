import React, { type ChangeEvent, createContext, type FC, type ReactNode, useEffect, useRef, useState} from "react";
import clsx from "clsx";
import styles from "./AccountsNav.module.pcss";
import Input from "@/shared/ui/Input.tsx";
import {Gradients, Icon, SvgIcon} from "src/defines";
import {modal} from "@/shared/ui/Modal.tsx";
import {openAddAccount } from "@/pages/Modals/AddAccount.tsx";
import {toast, ToastVariant} from "@/shared/ui/Toast.tsx";
import {ToggleButton} from "@/shared/ui/ToggleButton.tsx";
import {IDraggableContext, IDraggableInfo} from "@/shared/ui/Draggable.tsx";
import {type ObservableProxy} from "@/shared/lib/observer/observableProxy.ts";
import {type Account} from "@/entity/account.ts";
import {accounts, importAccounts, updateAccounts} from "@/store/accounts.ts";
import {ExportData} from "@/pages/Modals/ExportData.tsx";
import {formatFileDate} from "@/shared/lib/utils.ts";
import {verifyVersion} from "@/shared/services/cryptography.ts";
import {DecryptionPopup} from "@/pages/Modals/Authentication.tsx";
import {flagStore, useFlagStore} from "@/store/local.tsx";
import {FilterFunction} from "@/shared/hooks/useProxyFilter.ts";
import {Tooltip} from "@/shared/ui/Popup/Tooltip.tsx";

interface IAccountsNavProps {
    children: ReactNode;
    filter: (filter: FilterFunction<Account>) => void;
}

export const AccountsContext = createContext<IDraggableContext>(undefined!)

/*const filters = [
    {
        type: "search",
        fields: [
            {
                name: "Nickname",
                prop: "nickname"
            },
            {
                name: "Login",
                prop: "login"
            },
            {
                name: "Email",
                prop: "email"
            }
        ]
    },
    {
        type: "sort",
        fields: [
            {
                name: "Nickname",
                prop: "nickname"
            },
            {
                name: "Login",
                prop: "login"
            },
            {
                name: "Email",
                prop: "email"
            }
        ]
    },
    {
        type: "flag",
        fields: [
            {
                name: "Two-factor",
                prop: "authenticator"
            }
        ]
    },
]*/

const AccountsNav: FC<IAccountsNavProps> = ({ children, filter }) => {
    const [expanded, setExpanded] = useState(false);
    const [isDragging, setDragging] = useState(false);
    const [isDragState, setDragState] = useState(false);
    const infoRef = useRef<IDraggableInfo>({});
    const fileInputRef = useRef<HTMLInputElement>(null!);
    const [isUpdating] = useFlagStore<boolean>(nameof(flagStore.store.isDbUpdating))


    const addClicked = () => {
        setExpanded(false)
        openAddAccount()
    }

    const exportClicked = () => {
        setExpanded(false)
        modal.open({
            body: <ExportData getData={() => [`Database Backup ${formatFileDate()}`, accounts.value]}
                              encryptedExtension="sodb"/>,
            title: "Export database"
        })
    }

    const importFileSelected = (e:   ChangeEvent<HTMLInputElement>) => {
        setExpanded(false)
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
                               autoComplete={"off"} onInput={(e) => {
                                filter(data => data.filter(acc =>
                                    acc.nickname.toUpperCase().includes(e.currentTarget.value.toUpperCase())
                                ))
                        }}
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
                        { isUpdating ?
                            <Tooltip message="Stop updating accounts">
                                <button className="px-3" onClick={() => updateAccounts(true)}>
                                    <SvgIcon icon={Icon.Close} size={20} className="fill-danger"/>
                                </button>
                            </Tooltip> :
                            <Tooltip message="Update accounts info">
                                <button className="px-3" onClick={() => updateAccounts(isUpdating)}>
                                    <SvgIcon icon={Icon.DatabaseUpdate} size={20} fill={Gradients.LightBlue}/>
                                </button>
                            </Tooltip>
                        }

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