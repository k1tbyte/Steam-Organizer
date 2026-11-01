import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { helloKind } from '../services/passkey'

/** What this OS calls its platform authenticator: "Windows Hello", "Touch ID", "Fingerprint" (Android), else "Passkey". */
export function useHelloLabel() {
    const { t } = useI18n()
    return computed(
        () =>
            ({
                windows: t('Windows Hello'),
                touchid: t('Touch ID'),
                fingerprint: t('Fingerprint'),
                passkey: t('Passkey'),
            })[helloKind()],
    )
}
