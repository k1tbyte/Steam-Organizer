import {forwardRef, TextareaHTMLAttributes, useEffect, useImperativeHandle, useRef} from "react";

interface ITextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string,
    onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void,
    autoResize?: boolean;
    maxRows?: number;
}

const getLineBreaks = (str: string) => str.match(/\n/g)?.length ?? 0;

export const TextArea = forwardRef<HTMLTextAreaElement,ITextAreaProps>(({ className, autoResize, maxRows, ...props}, forwardedRef) => {

    const ref = useRef<HTMLTextAreaElement>();

    useImperativeHandle(forwardedRef, () => ref.current);

    useEffect(() => {
        if (!autoResize) {
            return;
        }

        const target = ref.current;
        const resize = () => {
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
        }

        resize()
        target.addEventListener("input", resize);

        return () => target.removeEventListener("input", resize);
    }, []);

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
                  className={`w-full placeholder-foreground-muted p-3 outline-0 outline-none rounded text-foreground text-2xs focus:placeholder:opacity-50 placeholder:duration-300 placeholder:transition-opacity bg-transparent ${className}`}/>
    )
})