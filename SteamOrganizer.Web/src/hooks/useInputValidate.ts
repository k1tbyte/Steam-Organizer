import { RefObject, useEffect, useRef} from "react";

const emailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$');
const steamApiKeyRegex = new RegExp('^[A-Fa-f0-9]{32}$')

export type TypeInputValidator = (input: string) => string | null;

interface InputValidators {
    [key: string]: TypeInputValidator;
}

export const validator: InputValidators = {
    required:  input =>  input.length == 0 ? "Required" : null,
    password: input => input.length < 8 ? "Must be minimum 8 characters" : null,
    email: input => emailRegex.test(input) ? null : "Must be an email",
    steamApiKey: input =>  steamApiKeyRegex.test(input) ? null : "Invalid api key"
}

/**
 * Usage: [inputRef, messageRef, validateRef] = useInputValidate()
 *
 * `[in] inputRef`: reference to input for validation
 *
 * `[in] messageRef`: reference to an object to display a validation error (p, span, etc.)
 *
 * `[out] validateRef`: manual validator call
 */
export const useInputValidate = (validators: Array<TypeInputValidator>, onSuccess?: (input: string) => void):
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
            onSuccess?.(input.value)
            return true;
        }

        input.addEventListener('input', validateRef.current)

        return () => {
            input.removeEventListener('input', validateRef.current)
        }

    }, []);
    return [inputRef, messageRef, validateRef]
}