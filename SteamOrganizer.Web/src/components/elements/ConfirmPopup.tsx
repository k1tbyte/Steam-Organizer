import {EPlacementX, EPlacementY, type IPopupProps, Popup} from "@/components/primitives/Popup.tsx";
import {type FC} from "react";
import Button, {EButtonVariant} from "@/components/primitives/Button.tsx";

interface IConfirmPopupProps extends IPopupProps {
    text: string;
    onYes?: () => void;
    onNo?: () => void;
}

export const ConfirmPopup: FC<IConfirmPopupProps> = ({ children, text, onYes, onNo }) => {
    return (
        <Popup alignY={EPlacementY.Bottom} alignX={EPlacementX.Center} offset={{ y: 5, x:0 }} content={ () => (
            <div className="max-w-60 text-wrap text-center py-2">
                <span>{text}</span>
                <div className="flex-center gap-5 mt-3">
                    <Button variant={EButtonVariant.Outlined}
                            className="border-danger hover:bg-danger text-danger hover:text-foreground-accent" children="No" onClick={onNo}/>
                    <Button variant={EButtonVariant.Outlined} onClick={onYes} children="Yes"/>
                </div>
            </div>
        )}>
            {children}
        </Popup>
    )
}