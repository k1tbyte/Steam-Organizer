import React, {FC, ReactElement, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {Gradients, Icon, SvgIcon} from "@/defines";

let setToasts: React.Dispatch<React.SetStateAction<IToastProps[]>>;
const variants: [string, ReactElement][] = [
    [ "Info", <SvgIcon icon={Icon.InfoCircleOutline} fill={Gradients.LightBlue} size={26}/> ],
    [ "Warning", <SvgIcon icon={Icon.AlertCircleOutline} className="fill-yellow-300" size={26}/> ],
    [ "Error", <SvgIcon icon={Icon.CloseCircleOutline} className="fill-danger" size={26}/> ],
    [ "Success", <SvgIcon icon={Icon.CheckCircleOutline} fill={Gradients.Success} size={26}/> ],
]

export const enum ToastVariant {
    Info,
    Warning,
    Error,
    Success
}

interface IToastProps {
    id?: number | string;
    body: ReactElement | string;
    clickAction?: () => void;
    autoClosable?: boolean;
    canClose?: boolean;
    delay?: number;
    variant?: ToastVariant;
}

const Toast: FC<IToastProps> = React.memo(
    ({id, body, clickAction = undefined,
         autoClosable = true, canClose = true,
         delay = 3000, variant = ToastVariant.Info}) => {

    let timer: number;
    const onClose = () => {
        if(canClose) {
            timer = -1;
            toast.close(id!);
        }
    }
    const setTimer = () => {
        if(timer === -1 || !autoClosable || !canClose) {
            return
        }
        clearTimeout(timer)
        timer = window.setTimeout(onClose, delay);
    }
    setTimer();

    const [ title, icon ] = variants[variant]

    return (
        <motion.div onMouseEnter={() => clearTimeout(timer)}
                    onMouseLeave={setTimer}
                    onMouseDown={e => e.button === 1 && onClose()}
                    onClick={() => {
                        if(!clickAction) {
                            return;
                        }
                        clickAction();
                        clickAction = undefined
                        onClose()
                    }}
                    initial={{ marginRight: "-384px" }}
                    animate={{ marginRight: "0px" }}
                    exit={{ marginRight: "-384px"}} layout
                    className="w-full max-w-96  p-3.5 bg-primary rounded-md pointer-events-auto drop-shadow-md">
            <div className="flex items-start justify-between">
                <div className="flex gap-2.5 items-center">
                    {icon}
                    <span className="font-medium text-foreground-accent">{title}</span>
                </div>
                {canClose && <SvgIcon className="fill-foreground hover:fill-foreground-accent transition-colors"
                                      icon={Icon.Close} role="button"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          onClose();}}
                                      size={18} />}
            </div>
            <div className="text-2xs mt-1.5 ml-9 mr-5 text-foreground">
                {body}
            </div>
        </motion.div>
    )
})

export const ToastsHost: FC = () => {
    const [toasts, setToast] = useState<IToastProps[]>(undefined!)
    setToasts = setToast
    if (toasts === undefined) {
        return
    }

    return (
        <div className="fixed pointer-events-none w-full z-50 px-2 right-0 bottom-[1%] flex items-end flex-col gap-3 overflow-x-clip">
            <AnimatePresence onExitComplete={() => {
                if (toasts.length === 0) {
                    setToast(undefined!)
                }
            }}>
                {
                    toasts.map(i => <Toast key={i.id} {...i}/>)
                }
            </AnimatePresence>
        </div>
    )
}

export const toast = {
    open: (props: IToastProps) => {
        props.id = props.id ?? Math.random();
        setToasts((prev) => {
            if(prev && prev.findIndex(o => o.id === props.id) !== -1) {
                return prev
            }

            return prev ? [...prev, props] : [props];
        })
        return props.id
    },
    close: (id: number | string) => {
        setToasts((prev) =>
            prev?.filter(o => o.id !== id)
        )
    }
}