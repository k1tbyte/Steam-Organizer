import * as DialogPrimitive from "@radix-ui/react-dialog"
import {FC, ReactNode} from "react";

interface IDialogProps {
    title: string,
    contentClass?: string,
    trigger?: ReactNode,
    isOpen?: boolean,
    onStateChange?: (open: boolean) => void,
    children?: ReactNode
}

const Dialog: FC<IDialogProps> =  ({   title, children, contentClass, trigger,
                                       isOpen, onStateChange}) =>
{
    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={onStateChange}>
            {
                trigger &&
                <DialogPrimitive.Trigger asChild>
                    {trigger}
                </DialogPrimitive.Trigger>
            }

            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"/>
                <DialogPrimitive.Content className={`${contentClass} fixed flex flex-col z-50 w-[90vw] bg-pr-2 p-[10px] font-segoe
                                                    rounded-default translate-x-[-50%] translate-y-[-50%] top-[50%] left-[50%]
                                                    data-[state=open]:animate-[pop-in_0.2s] data-[state=closed]:animate-[pop-out_0.1s]`}>

                    <DialogPrimitive.Close className="bg-close w-3 h-3 rounded-full"/>
                    <DialogPrimitive.Title className="text-lg mb-2 text-center font-semibold">{title}</DialogPrimitive.Title>

                    <div className="bg-pr-1 h-1 -mx-[10px] mb-2"/>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

export default Dialog;
