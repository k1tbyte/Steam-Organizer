import { createI18n } from 'vue-i18n'

// Keys are source English; fallbackFormat compiles them so interpolation works before locale files exist.
export const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: false,
    fallbackFormat: true,
    missingWarn: false,
    fallbackWarn: false,
})
