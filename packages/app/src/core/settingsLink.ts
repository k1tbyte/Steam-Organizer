import { type InjectionKey, inject, provide } from 'vue'

/** Opens Settings at a section key. */
export type SettingsLink = (section: string) => void

const settingsLinkKey: InjectionKey<SettingsLink> = Symbol('settings-link')

/** Settings imports the features it configures, so they open it through this; the shell provides it. */
export function provideSettingsLink(open: SettingsLink) {
    provide(settingsLinkKey, open)
}

export function useSettingsLink(): SettingsLink {
    return inject(settingsLinkKey, () => {})
}
