import { forwardRef, InputHTMLAttributes} from "react";
import {cn} from "@/lib/utils.ts";

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string,
}

const  Input = forwardRef<HTMLInputElement,IInputProps>((
    { className, ...props},ref) => {
    return (
        <input type="text" ref={ref} {...props}
               className={cn("w-full placeholder-foreground-muted px-2.5 outline-0 outline-none rounded-sm text-foreground text-2xs focus:placeholder:opacity-50 placeholder:duration-300 placeholder:transition-opacity bg-accent h-[35px]", className)}/>
    )
})

export default Input;