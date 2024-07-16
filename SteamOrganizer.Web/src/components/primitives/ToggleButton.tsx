import {
    type ButtonHTMLAttributes,
    type ReactNode,
    forwardRef,
    useState
} from "react";

interface IToggleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    onContent: ReactNode;
    offContent: ReactNode;
    onChanged?: (isChecked: boolean) => void;
    isChecked?: boolean;
}

export const ToggleButton = forwardRef<HTMLButtonElement,IToggleButtonProps>((
    {
        onContent,
        offContent,
        onChanged,
        isChecked = false,
        ...props
    }, ref) => {

    const [checked, setChecked] = useState(isChecked)

    return (
        <button ref={ref} onClick={() => {
            setChecked(prev => {
                onChanged?.(!prev)
                return !prev;
            });
        }} {...props}>
            {checked ? onContent : offContent}
        </button>
    )
});