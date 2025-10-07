import {
    type ButtonHTMLAttributes,
    type ReactNode,
    forwardRef,
    useState
} from "react";

interface IToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    onContent: ReactNode;
    offContent: ReactNode;
    setEnabled?:  React.Dispatch<React.SetStateAction<boolean>>;
    isEnabled?: boolean;
}

export const ToggleButton = forwardRef<HTMLButtonElement,IToggleButtonProps>((
    {
        onContent,
        offContent,
        setEnabled,
        isEnabled = false,
        ...props
    }, ref) => {

    return (
        <button ref={ref}
                onClick={() => setEnabled(prev => !prev)}
                {...props}>
            {isEnabled ? onContent : offContent}
        </button>
    )
});