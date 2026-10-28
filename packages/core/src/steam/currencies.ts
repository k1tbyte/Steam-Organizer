/** Steam's store currencies by code, with the country whose prices the store quotes in it (`cc`). */
export const STEAM_CURRENCIES = {
    USD: 'US',
    EUR: 'FR',
    GBP: 'GB',
    RUB: 'RU',
    UAH: 'UA',
    KZT: 'KZ',
    PLN: 'PL',
    CHF: 'CH',
    NOK: 'NO',
    BRL: 'BR',
    MXN: 'MX',
    CAD: 'CA',
    COP: 'CO',
    CLP: 'CL',
    PEN: 'PE',
    UYU: 'UY',
    CRC: 'CR',
    AUD: 'AU',
    NZD: 'NZ',
    JPY: 'JP',
    KRW: 'KR',
    CNY: 'CN',
    TWD: 'TW',
    HKD: 'HK',
    SGD: 'SG',
    MYR: 'MY',
    IDR: 'ID',
    PHP: 'PH',
    THB: 'TH',
    VND: 'VN',
    INR: 'IN',
    ILS: 'IL',
    SAR: 'SA',
    AED: 'AE',
    QAR: 'QA',
    KWD: 'KW',
    ZAR: 'ZA',
} as const

export type SteamCurrency = keyof typeof STEAM_CURRENCIES

export const DEFAULT_CURRENCY: SteamCurrency = 'USD'

export const isSteamCurrency = (value: unknown): value is SteamCurrency =>
    typeof value === 'string' && Object.hasOwn(STEAM_CURRENCIES, value)
