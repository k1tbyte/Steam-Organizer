import {Icon, SvgIcon} from "@/defines";
import {FC, ReactElement, ReactNode} from "react";

interface ICollectionIndicatorProps {
    icon?: Icon;
    title: string;
    subtitle: string | ReactElement<HTMLSpanElement>;
    children?: ReactNode;
}

export const CollectionIndicator: FC<ICollectionIndicatorProps> = ({ icon, title, subtitle, children }) => {
    return (
        <div className="absolute translate-center text-foreground-muted text-center flex-center flex-col text-nowrap">
            {icon &&
                <div className="bg-accent/20 rounded-2xl py-5 px-6 mb-2">
                    <SvgIcon icon={Icon.SearchInList} className="fill-secondary" size={40}/>
                </div>
            }
            <p className="font-bold text-lg mb-3">{title}</p>
            <span className="text-xs mb-3">{subtitle}</span>
            {children}
        </div>
    )
}

export const SearchCollectionIndicator: FC = () => {
    return <CollectionIndicator icon={Icon.SearchInList} title="No results" subtitle="The search did not return any results"/>
}

export const EmptyCollectionIndicator: FC = () => {
    return <CollectionIndicator icon={Icon.NoDataToDisplay} title="The list is empty" subtitle="There is no data to display"/>
}