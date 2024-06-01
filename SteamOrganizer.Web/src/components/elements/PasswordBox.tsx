import {forwardRef, InputHTMLAttributes, useState} from "react";
import clsx from 'clsx';

import { IoMdEyeOff,IoMdEye } from "react-icons/io";
import Input from "@/components/elements/Input.tsx";

interface IPasswordBoxProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string,
}

export const PasswordBox = forwardRef<HTMLInputElement,IPasswordBoxProps> (
    ({className, ...props}, ref) => {
    const [passwordVisible,setPasswordVisibility]= useState(false);

    return(
        <div className={clsx("w-full flex items-center bg-pr-3 rounded-xm text-fg-2 text-2xs",className)}>
            <Input type={clsx(passwordVisible || "password","")} {...props} ref={ref}
                   className="bg-transparent"/>
            <button className="h-full hover:text-fg-3 transition-all pr-2.5"
                    onClick={() => setPasswordVisibility((prev) => !prev)}>
                {
                    passwordVisible ? <IoMdEye size={18} /> : <IoMdEyeOff size={18} />
                }
            </button>
        </div>
    )
})