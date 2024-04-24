import { Root, Trigger, Portal, Overlay, Content, Title, Close } from "@radix-ui/react-dialog"
import { FC, ReactNode} from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store.ts";
import { useActions } from "../../hooks/useActions.ts";

export interface IModalData {
    title?: string,
    contentClass?: string,
    children?: ReactNode,
    preventClosing?: boolean
}

interface IModalProps extends  IModalData {
    trigger?: ReactNode,
    isOpen?: boolean,
    onStateChange?: (open: boolean) => void,
}

export const Modal: FC<IModalProps> = (props) => {
    return (
        <Root open={props.isOpen}  onOpenChange={props.onStateChange}>
            {
                props.trigger &&
                <Trigger /*asChild*/>
                    {props.trigger}
                </Trigger>
            }
            <Portal>
                <Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"/>
                <Content className={`${props.contentClass} fixed flex flex-col z-50 w-[90vw] bg-pr-2 p-[10px]
                                                    rounded-2xm translate-x-[-50%] translate-y-[-50%] top-[50%] left-[50%]
                                                    data-[state=open]:animate-[pop-in_0.2s] data-[state=closed]:animate-[pop-out_0.1s]`}>

                    { props.preventClosing !== true && <Close className="bg-close w-3 h-3 rounded-full"/> }
                    <Title className="text-lg mb-2 text-center font-semibold text-fg-3">{props.title}</Title>

                    <div className="bg-pr-1 h-1 -mx-[10px] mb-3"/>
                    {props.children}
                </Content>
            </Portal>
        </Root>
    )
}

let rootModalData: IModalData | undefined;

export const  setModalData = (data: IModalData) => {
    rootModalData = data;
}

export const RootModal: FC =  () =>
{
    const props = useSelector((state: RootState) => state.ui)
    const { changeModalState } = useActions();

    return Modal({
        title: rootModalData?.title,
        children: rootModalData?.children,
        contentClass: rootModalData?.contentClass,
        isOpen: props.modalState,
        onStateChange: rootModalData?.preventClosing ? undefined:  () => { changeModalState(false) },
        preventClosing: rootModalData?.preventClosing
    })
}