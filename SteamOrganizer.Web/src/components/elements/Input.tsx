import { forwardRef, InputHTMLAttributes} from "react";
import {cn} from "../../lib/utils.ts";

interface IInputProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string,
}

const  Input = forwardRef<HTMLInputElement,IInputProps>((
    { className, ...props},ref) => {
    return (
        <input type="text" ref={ref} {...props}
               className={cn("w-full h-full placeholder-fg-1 placeholder:font-semibold px-2.5  outline-0 outline-none rounded-sm bg-pr-2 text-fg-2 text-2xs focus:placeholder:opacity-50 placeholder:duration-300 placeholder:transition-opacity", className)}/>
    )
})

export default Input;