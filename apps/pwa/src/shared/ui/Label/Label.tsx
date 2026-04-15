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
    [ELabelVariant.Primary]: "text-foreground-accent font-semibold",
    [ELabelVariant.Colorful]: styles.colorful
}

export const Label = forwardRef<HTMLSpanElement, ILabelProps>(({ children, className, variant = ELabelVariant.Primary, ...props }, ref) => {
    return (
        <span ref={ref} className={clsx("text-2xs", variants[variant], className)} {...props}>
            {children}
        </span>
    )
})