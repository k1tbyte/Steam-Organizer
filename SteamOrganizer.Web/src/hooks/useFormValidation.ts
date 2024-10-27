import { RefObject, useEffect, useRef} from "react";

const emailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$');
const steamApiKeyRegex = new RegExp('^[A-Fa-f0-9]{32}$')
const loginRegex = new RegExp("^(?=.*[A-Za-z0-9])(?!.*[/*\\-.+_@!&$#%]{2})[A-Za-z0-9/*\\-.+_@!&$#%]{3,64}$")

export type TypeInputValidator = (input: string) => string | null;

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
    },[validators, onSuccess])

    return formRef;
}

export const validators = {
    required:  input =>  input.length == 0 ? "Required" : null,
    login: input => loginRegex.test(input) ? null : "Invalid login",
    password: input => input.length < 6 ? "Must be minimum 6 characters" : null,
    phone: input => input.length < 8 ? "Invalid phone number" : null,
    email: input => emailRegex.test(input) ? null : "Must be an email",
    steamApiKey: input =>  steamApiKeyRegex.test(input) ? null : "Invalid api key"
}
