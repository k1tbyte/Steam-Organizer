import { type FC} from "react";
import {cn} from "@/lib/utils.ts";

interface ILoaderProps {
    className?: string;
    size?: number;
}

interface IStaticLoaderProps extends ILoaderProps {
    text?: string;
    absolute?: boolean;
}

export const Loader: FC<ILoaderProps> = ({ className, size = 54 }) => {
    return (
        <div className={className}>
            <svg width={size} height={size} viewBox="0 0 24 24"
                 className="animate-spin fill-foreground-muted">
                <path
                    d="M2,12A10.94,10.94,0,0,1,5,4.65c-.21-.19-.42-.36-.62-.55h0A11,11,0,0,0,12,23c.34,0,.67,0,1-.05C6,23,2,17.74,2,12Z"/>
            </svg>
        </div>
    )
}

export const LoaderStatic: FC<IStaticLoaderProps> = ({className, text, absolute = false}) => {
    return (
        <div className={cn("text-3xl text-foreground-muted font-bold", absolute ? "absolute translate-center" : "w-full h-full flex-center", className)}>
            {text ?? "Loading . . ."}
        </div>
    )
}