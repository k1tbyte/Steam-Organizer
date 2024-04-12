import {FC, useState} from "react";
import { IoMdEyeOff,IoMdEye } from "react-icons/io";

export const PasswordBox: FC =()=>{
    const [isPasswordVisible,setPasswordVisibility]= useState(false);
    function changePasswordVisibility(){
        setPasswordVisibility(!isPasswordVisible);
    }
    return(
        <div className="min-w-28 flex w-full  bg-pr-3 rounded-[3px] h-[36px] px-2">
            <input type={isPasswordVisible?"text":"password"}
                   placeholder=""
                   className={`w-full bg-transparent min-w-20 text-fg-2 focus:outline-none font-segoe  ${isPasswordVisible?"font-normal text-[13px]":"font-extrabold text-[18px]"}`}
                      />
            <button className=""
                    onClick={changePasswordVisibility}>
                {
                    isPasswordVisible?(
                        <IoMdEye size={19} className="text-fg-2 hover:text-white"/>
                    ):(
                        <IoMdEyeOff size={19} className="text-fg-2 hover:text-white" />
                    )
                }
            </button>
        </div>
    )
}