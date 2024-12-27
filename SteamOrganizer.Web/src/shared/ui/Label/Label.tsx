import React, {type ComponentProps, forwardRef} from "react";
import styles from "./Label.module.css";
import clsx from "clsx";

export const enum ELabelVariant {
    Primary,
    Colorful
}

interface ILabelProps extends ComponentProps<"span"> {
    children: string;
    variant?: ELabelVariant;
}

const variants = {
    [ELabelVariant.Primary]: "text-foreground-accent text-2xs font-semibold",
    [ELabelVariant.Colorful]: styles.colorful
}

export const Label = forwardRef<HTMLSpanElement, ILabelProps>(({ children, className, variant = ELabelVariant.Primary, ...props }, ref) => {
    return (
        <span ref={ref} className={clsx(variants[variant], "")} {...props}>
            {children}
        </span>
    )
})