import { RefObject, useEffect, useRef} from "react";

const  emailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$');

export type TypeInputValidator = (input: string) => string | null;

export const requiredValidator: TypeInputValidator = (input) =>
    input.length == 0 ? "Required" : null;

export const passwordValidator: TypeInputValidator = (input) => {
    return input.length < 8 ? "Must be minimum 8 characters" : null;
}

export const emailValidator: TypeInputValidator = (input) => {
    return emailRegex.test(input) ? null : "Must be an email"
}

export const useInputValidate = (validators: Array<TypeInputValidator>):
    [RefObject<HTMLInputElement>, RefObject<HTMLDivElement>, RefObject<() => boolean>] => {
    const inputRef = useRef<HTMLInputElement>(null)
    const messageRef = useRef<HTMLDivElement>(null)
    const validateRef = useRef<() => boolean>(() => false)

    useEffect(() => {
        const input = inputRef.current;
        const message = messageRef.current;
        if(!input || !message) {
            return;
        }

        validateRef.current = () => {
            for (const validator of validators) {
                const validateResult = validator(input.value);
                if(validateResult) {
                    message.textContent = validateResult
                    return false;
                }
            }

            if(message.textContent != null) {
                message.textContent = null
            }
            return true;
        }

        input.addEventListener('input', validateRef.current)

        return () => {
            input.removeEventListener('input', validateRef.current)
        }

    }, []);
    return [inputRef, messageRef, validateRef]
}