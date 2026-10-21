export type GateError = 'blank' | 'wrong'

/** What the unlock gate tells apart: nothing typed, and typed but not accepted. */
export function gateError(
    entered: string,
    accepted: boolean,
): GateError | null {
    if (entered === '') return 'blank'
    return accepted ? null : 'wrong'
}

/** The Lock dialog's password pair: the repeat must match before the account can be locked. */
export function checkLockForm(password: string, repeat: string) {
    const typed = repeat !== ''
    const matches = typed && repeat === password
    return {
        matches,
        mismatch: typed && !matches,
        canLock: password !== '' && matches,
    }
}
