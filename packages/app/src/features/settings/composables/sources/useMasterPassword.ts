import { DEMO_MASTER_PASSWORD } from '../../mocks'

/** Checks the master password; the vault feature unwraps its key with it once wired, the demo accepts one value. */
export function useMasterPassword() {
    function verify(password: string): boolean {
        return password === DEMO_MASTER_PASSWORD
    }

    return { verify }
}
