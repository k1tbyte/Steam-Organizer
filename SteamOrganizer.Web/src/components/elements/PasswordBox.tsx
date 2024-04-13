import {forwardRef, InputHTMLAttributes, useState} from "react";
import clsx from 'clsx';

import { IoMdEyeOff,IoMdEye } from "react-icons/io";

interface IPasswordBoxProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string,
}

export const PasswordBox = forwardRef<HTMLInputElement,IPasswordBoxProps> (
    ({className, ...props}, ref) => {
    const [passwordVisible,setPasswordVisibility]= useState(false);

    return(
        <div className={clsx("w-full h-[35px] flex items-center  bg-pr-3 rounded-small text-fg-2 text-def",className)}>
            <input type={clsx(passwordVisible || "password")} {...props} ref={ref}
                   className="w-full h-full placeholder-fg-1 placeholder:font-semibold px-2.5 bg-transparent outline-0 outline-none"/>
            <button className="h-full hover:text-fg-3 transition-all pr-2.5"
                    onClick={() => setPasswordVisibility((prev) => !prev)}>
                {
                    passwordVisible ? <IoMdEye size={18} /> : <IoMdEyeOff size={18} />
                }
            </button>
        </div>
    )
})