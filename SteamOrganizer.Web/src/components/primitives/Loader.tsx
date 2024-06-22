import {FC} from "react";

interface ILoaderProps {
    className?: string;
}

export const Loader: FC<ILoaderProps> = ({ className }) => {
    return (
        <div className={className}>
            <svg width="54" height="54" viewBox="0 0 24 24"
                 className="animate-spin fill-foreground-muted">
                <path
                    d="M2,12A10.94,10.94,0,0,1,5,4.65c-.21-.19-.42-.36-.62-.55h0A11,11,0,0,0,12,23c.34,0,.67,0,1-.05C6,23,2,17.74,2,12Z"/>
            </svg>
        </div>
    )
}