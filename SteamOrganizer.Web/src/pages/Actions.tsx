import React, { useState} from "react";
import clsx from "clsx";
import {RadioButton} from "@/shared/ui/RadioButton/RadioButton";
import Button from "@/shared/ui/Button";
import {Popup} from "@/shared/ui/Popup/Popup";
import {Tooltip} from "@/shared/ui/Popup/Tooltip";
import {EPlacement} from "@/shared/ui/Popup/positioning";
import {useTitle} from "@/shared/hooks/useTitle";

export default function Actions() {
    useTitle("Actions")

    const [activeIndex, setActive] = useState(0);

    return(
        <div className="flex-center flex-wrap gap-2 p-2 w-full h-full text-foreground-muted">
{/*            <RadioButton initialState={activeIndex}
                         className="text-sm bg-primary p-2 rounded-xl text-foreground"
                         generator={["First tab", "Second tab", "Third tab"]}>
                {(item, index, isActive) => {
                    return <div className={clsx("px-5 py-2",{ "text-foreground-accent": isActive })}>
                        <span>{item} {index}</span>
                    </div>;
                }}
            </RadioButton>

            <Popup placement={EPlacement.BottomCenter} offset={{ y: 5, x:0 }} content={<div>Test</div>}>
                <Button>This is context popup</Button>
            </Popup>

            <Tooltip message={"This is a tooltip"} canHover={true}>
                <Button>Hover for tooltip</Button>
            </Tooltip>*/}
            In development...


{/*            <RadioButton initialState={activeIndex}
                         className="text-sm bg-primary p-2 flex-y-center rounded-xl text-foreground gap-3"
                         indicator={null}
                         generator={[{ title: "First tab", icon: Icon.Steam }, { title: "Second tab", icon: Icon.Wargaming }, {title: "Third tab", icon: Icon.Cog } ]}>
                {(item, index, isActive) => {
                    return <div className={`rounded transition-transform cursor-pointer hover:scale-110 ${isActive ? "bg-chip text-foreground-accent" : "grad-chip text-foreground"}`}>
                        <Tooltip message={item.title} >
                            <SvgIcon className={`p-1.5`} role="button" icon={item.icon} size={38}/>
                        </Tooltip>
                    </div>
                }}
            </RadioButton>*/}
        </div>
    )
}