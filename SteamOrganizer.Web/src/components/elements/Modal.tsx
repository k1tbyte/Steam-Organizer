import { AnimatePresence, motion } from "framer-motion";
import React, {Dispatch, FC, Fragment, ReactNode, SetStateAction, useEffect, useRef, useState} from "react";
import {cn} from "@/lib/utils.ts";

interface IModalOptions {
    onClosing?: () => boolean | undefined;
    body: ReactNode;
    id?: number;
}

interface IModalProps extends  IModalOptions {
    title?: string,
    withCloseButton?: boolean,
    className?: string
}

let setModals: Dispatch<SetStateAction<IModalOptions[]>>;
let prevCount: number = 0;

const handleClose = (id: number, onClosing?: () => boolean | undefined) => {
    if(!onClosing?.()) {
        modal.close(id);
    }
}

const ModalBody: FC<IModalProps> = React.memo(
    ({ body,
         onClosing,
         id, className,
         title,
         withCloseButton = true}) => {

        return (
            <motion.div className={cn("fixed left-[50%] top-[50%] z-50 rounded-2xm bg-pr-2 p-[10px] translate-x-[-50%] translate-y-[-50%]",className)}
                        modal-id={id}
                        initial={{ opacity: 0, marginTop: -80 }}
                        animate={{ opacity: 1, marginTop: 0  }}
                        exit={{ opacity: 0, marginTop: -80 }}>
                {
                    withCloseButton &&
                    <div role="button" className="bg-close w-3 h-3 rounded-full"
                         onClick={() => handleClose(id!, onClosing)}/>
                }

                <h2 className="text-lg mb-2 text-center font-semibold text-fg-3">{title}</h2>
                <div role="separator" className="bg-pr-1 h-1 -mx-[10px] mb-3"/>
                {body}
            </motion.div>
        )
    })

export const ModalsHost = () => {
    const [modals, setHostModals] = useState<IModalOptions[]>([])
    const overlayRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setModals = setHostModals
    },[])

    useEffect(() => {
        if(!modals.length) {
            return
        }

        const modalElement = overlayRef.current!.nextElementSibling! as HTMLElement
        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, textarea'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        firstElement?.focus()

        function handleModalKey(event: KeyboardEvent) {
            if (event.code === 'Escape') {
                const last = modals[modals.length-1]
                handleClose(last.id!, last.onClosing)
                return
            }

            if (event.key === "Tab" && firstElement) {
                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                }
                else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        }

        modalElement.addEventListener('keydown', handleModalKey)
        return () => modalElement.removeEventListener('keydown', handleModalKey)
    }, [modals])

    return (
        <AnimatePresence >
            {modals.length &&
                modals?.map((o, i) => {
                    return (
                        <Fragment key={i}>
                            {
                                i === (modals.length - 1) &&
                                <motion.div ref={overlayRef}
                                            initial={{opacity: prevCount > 0 ? 1 : 0 }}
                                            animate={{opacity: 1}}
                                            exit={{opacity: 0}}
                                            className="fixed z-50 inset-0 backdrop-saturate-150 bg-black/80 backdrop-blur-md"
                                            aria-hidden="true"
                                            onClick={() => handleClose(o.id!, o.onClosing)}/>
                            }
                            {o.body}
                        </Fragment>
                    )
                })
            }
        </AnimatePresence>
    )
}

export const useModalActions = () => {
    const contentRef = useRef<HTMLDivElement>(null)
    function closeModal() {
        const id = contentRef.current?.parentElement?.getAttribute("modal-id") as number | undefined
        if(id) {
            modal.close(id)
        }
    }
    return {contentRef, closeModal }
}

export const modal = {
    close: (id: number = -1) => setModals(prev => {
        prevCount = prev.length
        prev.splice(id, 1)
        return [...prev];
    }),
    open: (props: IModalProps) => {
        setModals(prev => {
            prevCount = prev.length
            props.id = prev.length
            return [...prev,
                {id: props.id, onClosing: props.onClosing, body: <ModalBody {...props} />}
            ];
        });
        return props.id!;
    },
}