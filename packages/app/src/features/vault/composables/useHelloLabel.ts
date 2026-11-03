import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type HelloKind = 'windows' | 'touchid' | 'fingerprint' | 'passkey'

/** What the OS calls its platform authenticator, from the platform and user agent strings. */
export function helloKindOf(platform: string, userAgent: string): HelloKind {
    const both = `${platform} ${userAgent}`
    if (/android/i.test(both)) return 'fingerprint'
    if (/iphone|ipad|ipod|mac/i.test(both)) return 'touchid'
    if (/win/i.test(both)) return 'windows'
    return 'passkey'
}

function helloKind(): HelloKind {
    const nav = globalThis.navigator as
        | (Navigator & { userAgentData?: { platform?: string } })
        | undefined
    return helloKindOf(
        nav?.userAgentData?.platform ?? nav?.platform ?? '',
        nav?.userAgent ?? '',
    )
}

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
