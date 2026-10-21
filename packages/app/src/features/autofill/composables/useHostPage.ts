import { useDebounceFn, useMutationObserver } from '@vueuse/core'
import { onMounted, shallowRef } from 'vue'

import { classifyPage, type FieldInfo } from '../services/classify'

const SCAN_DEBOUNCE_MS = 150
const FIELDS = 'input:not([disabled]):not([readonly])'

/** What the host page asks for, with its real inputs. */
export type HostTarget =
    | { kind: 'login'; login: HTMLInputElement; password: HTMLInputElement }
    | { kind: 'guard'; code: HTMLInputElement[] }

export const fieldsOf = (target: HostTarget | null): HTMLInputElement[] => {
    if (!target) return []
    return target.kind === 'login'
        ? [target.login, target.password]
        : target.code
}

function describe(input: HTMLInputElement): FieldInfo {
    return {
        type: input.type,
        name: input.name,
        id: input.id,
        autocomplete: input.autocomplete,
        placeholder: input.placeholder,
        ariaLabel: input.getAttribute('aria-label') ?? '',
        maxLength: input.maxLength,
        visible: input.checkVisibility({ visibilityProperty: true }),
    }
}

function findTarget(): HostTarget | null {
    const inputs = [...document.querySelectorAll<HTMLInputElement>(FIELDS)]
    const page = classifyPage(inputs.map(describe))
    if (page?.kind === 'login') {
        const login = inputs[page.login]
        const password = inputs[page.password]
        return login && password ? { kind: 'login', login, password } : null
    }
    if (page?.kind === 'guard') {
        const code = page.code.flatMap((index) => inputs[index] ?? [])
        return code.length > 0 ? { kind: 'guard', code } : null
    }
    return null
}

function isSame(a: HostTarget | null, b: HostTarget | null) {
    const left = fieldsOf(a)
    const right = fieldsOf(b)
    return (
        a?.kind === b?.kind &&
        left.length === right.length &&
        left.every((input, i) => input === right[i])
    )
}

// A framework-controlled input keeps its own copy of the value; an input event makes it read the new one.
function setValue(input: HTMLInputElement, value: string) {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
}

/** The login or Steam Guard inputs on the page, kept current as the page rebuilds itself, and the writes into them. */
export function useHostPage() {
    const target = shallowRef<HostTarget | null>(null)

    function scan() {
        const next = findTarget()
        if (!isSame(target.value, next)) target.value = next
    }
    const scanSoon = useDebounceFn(scan, SCAN_DEBOUNCE_MS)

    onMounted(scan)
    // Steam's sign-in is a single page: the form and the code prompt swap in place.
    useMutationObserver(document.body, scanSoon, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['type', 'class', 'style', 'hidden', 'disabled'],
    })

    return {
        target,
        fillLogin(login: string, password: string) {
            const page = target.value
            if (page?.kind !== 'login') return
            setValue(page.login, login)
            setValue(page.password, password)
        },
        fillCode(code: string) {
            const page = target.value
            if (page?.kind !== 'guard') return
            // A split entry takes one character a box.
            const [only] = page.code
            if (page.code.length === 1 && only) return setValue(only, code)
            page.code.forEach((input, i) => {
                setValue(input, code[i] ?? '')
            })
        },
    }
}
