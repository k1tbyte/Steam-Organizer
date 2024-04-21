
import {MdDelete, MdOutlineRestorePage} from "react-icons/md";
import {FC} from "react";

interface IBackupProps{
    name?:string
    icon?:string
    date?:Date
}

 const  Backup:FC<IBackupProps>=({name,icon,date})=>{
    return(
        <div className="flex min-h-[105px] w-full bg-pr-2  p-4 pr-10 rounded-[3px] relative">
            <div className="ml-3 flex flex-col justify-center">
                <div className="inline-flex">

                    <span className="text-[14px]">{name}</span>
                    <img src={icon}
                         alt=""
                         className="ml-3 h-[20px] w-[20px]"/>
                </div>

                <div className="">
                    <span className="text-fg-2 text-xs font-medium w-full"><b className="text-pr-4">Date :</b> {date!.toLocaleString()}</span>
                </div>
            </div>
            <MdOutlineRestorePage className="absolute text-fg-1 right-3 top-3 hover:text-blue-500 btn" size={23}/>
            <MdDelete className="absolute text-fg-1 right-3 bottom-3 hover:text-failed btn" size={23}/>

        </div>
    )
}
Backup.defaultProps={
    name:"Default backup name",
    icon:"https://img.icons8.com/fluency/48/google-drive--v2.png",
    date:new Date(0)
}
export default Backup