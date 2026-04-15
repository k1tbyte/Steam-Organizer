import React, {type FC} from "react";
import {Icon, SvgIcon} from "src/defines";

export const InfoNote: FC<{title: string}> = ({ title }) => {
    return (
        <div className="text-[12px] text-foreground relative pl-5 text-justify pr-2 mb-3">
            <SvgIcon icon={Icon.InfoMark} size={18} className="text-foreground-accent absolute -left-0.5 top-0.5"/>
            {title}
        </div>
    )
}