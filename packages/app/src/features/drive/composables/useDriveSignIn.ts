import { useToast } from '@so/ui/useToast'
import { useI18n } from 'vue-i18n'

import { useDrive } from './useDrive'
import { useDriveProblem } from './useDriveProblem'

/** Google sign-in from a click (Google may open its window only then): a closed window is a quiet false, a failure says why. */
export function useDriveSignIn() {
    const { t } = useI18n()
    const drive = useDrive()
    const toast = useToast()
    const { problemOf } = useDriveProblem()

    return async function signIn(): Promise<boolean> {
        try {
            return await drive.connect()
        } catch (error) {
            toast.add({
                color: 'danger',
                title: t("Couldn't connect Google Drive"),
                description: problemOf(error).description,
            })
            return false
        }
    }
}
