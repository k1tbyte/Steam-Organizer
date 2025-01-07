import Button, {EButtonSize, EButtonVariant} from "@/shared/ui/Button";
import {Icon, SvgIcon} from "@/defines";
import {type ComponentProps, type ElementType, type FC, ReactElement, type ReactNode} from "react";
import {ContentType, Popup} from "@/shared/ui/Popup/Popup";
import {EPlacement} from "@/shared/ui/Popup/positioning";
import styles from "./CopyButtun.module.css"
import {clsx} from "clsx";

type ClipboardDataType = string | number | (() =>  (string | number));

interface ICopyButtonProps extends ComponentProps<'button'> {
    copyContent: ClipboardDataType;
    size?: number
}

interface ICopyAreaProps extends ComponentProps<ElementType> {
    copyContent: ClipboardDataType;
    as: ElementType;
    children: ReactNode;
}

const put = (data: ClipboardDataType) =>
    navigator.clipboard.writeText((data instanceof Function ? data() : data).toString())

const CopyPopup: FC<{children: ReactElement}> = ({ children }) => {
    return (
        <Popup content="Copied!" className="bg-secondary text-foreground-accent " timeout={250}
               placement={EPlacement.TopCenter} offset={{ x: 0, y: 5 }}>
            {children}
        </Popup>
    )
}

export const CopyButton: FC<ICopyButtonProps> = ({ copyContent, className, size = 15, ...props }) => {
    return <CopyPopup>
        <Button variant={EButtonVariant.None} size={EButtonSize.None}
                onPointerDown={async () => await put(copyContent)}
                {...props} className={clsx(styles.copyButton, className )}>
            <SvgIcon icon={Icon.Copy} size={size}/>
        </Button>
    </CopyPopup>
}

export const CopyArea: FC<ICopyAreaProps> = ({as: Component = "div", copyContent, children, ...props}) => {
    return <CopyPopup>
        <Component onPointerDown={async () => await put(copyContent)}  {...props}>
            {children}
        </Component>
    </CopyPopup>
}