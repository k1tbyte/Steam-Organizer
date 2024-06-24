import { RefObject, useEffect, useRef} from "react";

const emailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$');
const steamApiKeyRegex = new RegExp('^[A-Fa-f0-9]{32}$')
const loginRegex = new RegExp("^(?=.*[A-Za-z0-9])(?!.*[/*\\-.+_@!&$#%]{2})[A-Za-z0-9/*\\-.+_@!&$#%]{3,64}$")

export type TypeInputValidator = (input: string) => string | null;

interface InputValidators {
    [key: string]: TypeInputValidator;
}

const validate = (validator: TypeInputValidator, input: HTMLInputElement, message: Element | undefined) => {
    const validateResult = validator(input.value);
    if(validateResult) {
        message.textContent = validateResult
        return false;
    }

    if(message && message.textContent != null) {
        message.textContent = null
    }
    return true;
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
export const useInputValidation = (validator: TypeInputValidator, onSuccess?: (input: string) => void):
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

        validateRef.current = () => // @ts-ignore
            validate(validator, input, message) && (!onSuccess?.(input.value))

        input.addEventListener('input', validateRef.current)

        return () => {
            input.removeEventListener('input', validateRef.current)
        }
    }, []);
    return [inputRef, messageRef, validateRef]
}

export const useFormValidation = (validators: TypeInputValidator[],
                                onSuccess?: (e:  React.FormEvent<HTMLFormElement>) => void) => {
    const formRef = useRef<HTMLFormElement>();

    useEffect(() => {
        if(!formRef.current) {
            return;
        }
        const form = formRef.current;

        const inputs = form.querySelectorAll('input')
        const messages = form.querySelectorAll('[validation-text]')
        const actions = []
        for(let i = 0; i < inputs.length ; i++) {
            if(!validators[i]) {
                continue;
            }
            const callback = () => validate(validators[i], inputs[i], messages[i]);
            actions.push(callback)
            inputs[i].addEventListener('input', callback)
        }

        const onSubmit = (e) => {
            e.preventDefault();
            let success: boolean = true;
            for(const action of actions) {
                if(!action() && success) {
                    success = false;
                }
            }
            if(success) {
                onSuccess?.(e)
            }
        }

        form.addEventListener('submit', onSubmit)

        return () => {
            form.removeEventListener('submit', onSubmit)
            actions.forEach((o,i) => inputs[i].removeEventListener('input', o))
        }
    },[])

    return formRef;
}

export const validator: InputValidators = {
    required:  input =>  input.length == 0 ? "Required" : null,
    login: input => loginRegex.test(input) ? null : "Invalid login",
    password: input => input.length < 6 ? "Must be minimum 6 characters" : null,
    email: input => emailRegex.test(input) ? null : "Must be an email",
    steamApiKey: input =>  steamApiKeyRegex.test(input) ? null : "Invalid api key"
}
