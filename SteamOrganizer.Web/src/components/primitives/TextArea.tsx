import {forwardRef, TextareaHTMLAttributes} from "react";

interface ITextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string,
    onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void,
    autoResize?: boolean;
    maxRows?: number;
}

const getLineBreaks = (str: string) => str.match(/\n/g)?.length ?? 0;

export const TextArea = forwardRef<HTMLTextAreaElement,ITextAreaProps>(({ className, autoResize, maxRows, ...props},ref) => {

    const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;

        if (autoResize) {

            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
        }

        if (props.onInput) {
            props.onInput(e);
        }
    }

    const onBeforeInput = (e) => {
        if (!maxRows) {
            return;
        }

        const target = e.target as HTMLTextAreaElement;
        const lineBreaks = getLineBreaks(target.value) + getLineBreaks(e.data);
        if (lineBreaks >= maxRows) {
            e.preventDefault();
        }
    }


    return (
        <textarea ref={ref} {...props} onBeforeInput={onBeforeInput}
                  onInput={onInput}
                  className={`w-full placeholder-foreground-muted p-2.5 outline-0 outline-none rounded text-foreground text-2xs focus:placeholder:opacity-50 placeholder:duration-300 placeholder:transition-opacity bg-transparent ${className}`}/>
    )
})