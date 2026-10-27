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
