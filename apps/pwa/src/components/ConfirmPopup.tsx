import {type FC, ReactElement} from "react";
import Button, {EButtonVariant} from "@/shared/ui/Button";
import {Popup} from "@/shared/ui/Popup/Popup";
import {EPlacement} from "@/shared/ui/Popup/positioning";

interface IConfirmPopupProps {
    text: string;
    onYes?: () => void;
    onNo?: () => void;
    children: ReactElement;
}

export const ConfirmPopup: FC<IConfirmPopupProps> = ({ children, text, onYes, onNo }) => {
    return (
        <Popup placement={EPlacement.BottomCenter} offset={{ y: 5, x:0 }} content={ () => (
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