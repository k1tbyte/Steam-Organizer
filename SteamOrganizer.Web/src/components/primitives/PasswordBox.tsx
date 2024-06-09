import {forwardRef, InputHTMLAttributes, useState} from "react";
import clsx from 'clsx';
import Input from "@/components/primitives/Input.tsx";
import {Icon, SvgIcon} from "@/assets";

interface IPasswordBoxProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string,
}

export const PasswordBox = forwardRef<HTMLInputElement,IPasswordBoxProps> (
    ({className, ...props}, ref) => {
    const [passwordVisible,setPasswordVisibility]= useState(false);

    return(
        <div className={clsx("w-full flex items-center bg-accent rounded-xm text-foreground text-2xs",className)}>
            <Input type={clsx(passwordVisible || "password","")} {...props} ref={ref}
                   className="bg-transparent"/>
            <button className="h-full hover:text-foreground-accent transition-all pr-2.5"
                    onClick={() => setPasswordVisibility((prev) => !prev)}>
                {
                    passwordVisible ? <SvgIcon icon={Icon.Eye} size={18} /> : <SvgIcon icon={Icon.EyeOff} size={18} />
                }
            </button>
        </div>
    )
})