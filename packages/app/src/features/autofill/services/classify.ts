/** What a host page input says about itself; the DOM glue extracts it, so classification runs without a DOM. */
export interface FieldInfo {
    type: string
    name: string
    id: string
    autocomplete: string
    placeholder: string
    ariaLabel: string
    /** -1 when the input sets none. */
    maxLength: number
    visible: boolean
}

/** Indices point into the field list the page was classified from. */
export type HostPage =
    | { kind: 'login'; login: number; password: number }
    | { kind: 'guard'; code: number[] }

const TEXT_TYPES = new Set(['', 'text', 'email', 'tel', 'number'])
const LOGIN_HINT = /user|login|account|email/
const CODE_HINT =
    /one-time-code|twofactor|two-factor|authcode|auth-code|otp|guard/
// Steam's code is five characters; a split entry is one box each.
const MIN_CODE_BOXES = 4
const MAX_SINGLE_CODE_LENGTH = 8

const isTextual = (field: FieldInfo) =>
    field.visible && TEXT_TYPES.has(field.type)

const hintsOf = (field: FieldInfo) =>
    `${field.name} ${field.id} ${field.autocomplete} ${field.placeholder} ${field.ariaLabel}`.toLowerCase()

/** The first run of single-character boxes that reads as one code split across inputs. */
function findCodeBoxes(fields: readonly FieldInfo[]): number[] | null {
    let run: number[] = []
    for (const [index, field] of fields.entries()) {
        if (isTextual(field) && field.maxLength === 1) {
            run.push(index)
            continue
        }
        if (run.length >= MIN_CODE_BOXES) return run
        run = []
    }
    return run.length >= MIN_CODE_BOXES ? run : null
}

function findCodeField(fields: readonly FieldInfo[]): number | null {
    const index = fields.findIndex(
        (field) =>
            isTextual(field) &&
            CODE_HINT.test(hintsOf(field)) &&
            (field.maxLength === -1 ||
                (field.maxLength >= MIN_CODE_BOXES + 1 &&
                    field.maxLength <= MAX_SINGLE_CODE_LENGTH)),
    )
    return index === -1 ? null : index
}

function findLoginForm(fields: readonly FieldInfo[]): HostPage | null {
    const password = fields.findIndex(
        (field) => field.visible && field.type === 'password',
    )
    if (password === -1) return null
    const before = [...fields.entries()].filter(
        ([index, field]) => index < password && isTextual(field),
    )
    // The closest hinted field, else the closest text field: Steam's own inputs carry no names.
    const hinted = before.findLast(([, field]) =>
        LOGIN_HINT.test(hintsOf(field)),
    )
    const login = (hinted ?? before.at(-1))?.[0]
    return login === undefined ? null : { kind: 'login', login, password }
}

/** What the page asks for: a Steam Guard code wins over a login form still on screen behind it. */
export function classifyPage(fields: readonly FieldInfo[]): HostPage | null {
    const boxes = findCodeBoxes(fields)
    if (boxes) return { kind: 'guard', code: boxes }
    const single = findCodeField(fields)
    if (single !== null) return { kind: 'guard', code: [single] }
    return findLoginForm(fields)
}
