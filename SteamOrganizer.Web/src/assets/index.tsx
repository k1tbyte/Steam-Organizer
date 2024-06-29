import grid from "./images/grid.webp"
import {FC, forwardRef, SVGAttributes} from "react";

export const enum Gradients {
    LightBlue = "url(#lightBlueGrad)",
    Success = "url(#successGrad)"
}

export const enum Icon {
    Steam = 1,
    SteamDb,
    CheckDecagram,
    AlertDecagram,
    UsersOutline,
    LightningOutline,
    FolderSync,
    EditSquare,
    EnterSquare,
    EditSquareOutline,
    Magnifier,
    Plus,
    Pin,
    Trash,
    Bell,
    Cog,
    SteamOutline,
    GameController,
    BadgeAward,
    Block,
    ChevronDown,
    UserOutline,
    Gamepad,
    Users,
    CheckCircle,
    Fingerprint,
    AlignJustify,
    Key,
    Identifier,
    UserText,
    BackupRestore,
    Eye,
    EyeOff,
    InfoMark,
    Close,
    AlertCircleOutline,
    InfoCircleOutline,
    CloseCircleOutline,
    CheckCircleOutline,
    Api,
    Incognito,
    Lock
}

export function Defs() {
    return (
        <svg width={0} height={0}>
            <defs>
                <linearGradient id="lightBlueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#87CEFA"/>
                    <stop offset="1" stopColor="#6c5ecf"/>
                </linearGradient>
                <linearGradient id="successGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#26F596"/>
                    <stop offset="1" stopColor="#0499F2"/>
                </linearGradient>
            </defs>
            <mask id="avatarMask">
                <use xlinkHref={`/sprites.svg#avatarMask`} fill="#ffff"/>
            </mask>
        </svg>
    )
}

interface ISvgIconProps extends SVGAttributes<SVGElement>  {
    size?: number;
    className?: string;
    icon: Icon;
}

export const SvgIcon = forwardRef<SVGSVGElement, ISvgIconProps>(
    ({
         icon,
         size,
         fill,
         ...props
    }, ref
    ) => {
    return (
        <svg fill={fill ?? "currentColor"} ref={ref}
             stroke={props.stroke ?? "currentColor"}
             strokeWidth={0}
             width={size ?? props.width}
             height={size ?? props.height} {...props} >
            <use xlinkHref={`/sprites.svg#i${icon}`}/>
        </svg>
    );
});

export {
    grid
}