import {Gradients, Icon, SvgIcon} from "@/defines";
import {FC} from "react";
import styles from "./BanChip.module.css"


interface IBanChipProps {
    name: string;
    banDescription?: string;
    banned?: boolean | number;
}

export const ProfileBanChip: FC<IBanChipProps> = ({name, banned, banDescription}) => (
    <div className={styles.container}>
        <span>{name}</span>
        {(banned) ?
            <>
                <SvgIcon className="text-danger" icon={Icon.AlertDecagram} size={32}/>
                <p className={styles.banned}>{banDescription}</p>
            </>
            : <SvgIcon fill={Gradients.Success} icon={Icon.CheckDecagram} size={32}/>
        }
    </div>
)
