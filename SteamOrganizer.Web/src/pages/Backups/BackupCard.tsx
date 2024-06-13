import {FC} from "react";
import {Icon, SvgIcon} from "@/assets";

interface IBackupProps{
    name?:string
    icon?:string
    date?:Date
}

 const  BackupCard: FC<IBackupProps> = ({name,icon,date}) => {
    return(
        <div className="flex min-h-[105px] w-full bg-primary  p-4 pr-10 rounded-[3px] relative">
            <div className="ml-3 flex flex-col justify-center">
                <div className="inline-flex">

                    <span className="text-[14px]">{name}</span>
                    <img src={icon}
                         alt=""
                         className="ml-3 h-[20px] w-[20px]"/>
                </div>

                <div className="">
                    <span className="text-foreground text-xs font-medium w-full"><b className="text-secondary">Date :</b> {date!.toLocaleString()}</span>
                </div>
            </div>
            <SvgIcon icon={Icon.BackupRestore} className="absolute text-foreground-muted right-3 top-3 hover:text-blue-500 btn" size={23}/>
            <SvgIcon icon={Icon.Trash} className="absolute text-foreground-muted right-3 bottom-3 hover:text-failed btn" size={23}/>

        </div>
    )
}
BackupCard.defaultProps={
    name:"Default backup name",
    icon:"https://img.icons8.com/fluency/48/google-drive--v2.png",
    date:new Date(0)
}
export default BackupCard