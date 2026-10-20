import { openFilePicker, type RevealOrigin } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    type PrefValue,
    reportError,
    useAppearancePref,
    useBackgroundImage,
    useReducedMotionPref,
} from '#core'

export function useAppearanceSection() {
    const { t, locale } = useI18n()
    const mode = useAppearancePref('mode')
    const accent = useAppearancePref('accent')
    const tint = useAppearancePref('tint')
    const surface = useAppearancePref('surface')
    const background = useAppearancePref('background')
    const radius = useAppearancePref('radius')
    const density = useAppearancePref('density')
    const motion = useReducedMotionPref()
    const language = useAppearancePref('language')
    const image = useBackgroundImage()

    // Keeps each value a literal, so a picker's payload is already a valid pref value.
    const item = <V extends string>(
        value: V,
        label: string,
        icon?: string,
    ) => ({
        value,
        label,
        icon,
    })
    const modeItems = computed(() => [
        item('dark', t('Dark'), 'icon-[lucide--moon]'),
        item('light', t('Light'), 'icon-[lucide--sun]'),
        item('system', t('System'), 'icon-[lucide--monitor]'),
    ])
    const surfaceItems = computed(() => [
        item('flat', t('Flat')),
        item('subtle', t('Subtle')),
        item('glass', t('Glass')),
    ])
    const backgroundItems = computed(() => [
        item('plain', t('Plain')),
        item('clean', t('Clean')),
        item('noisy', t('Noisy')),
        item('grid', t('Grid')),
        item('image', t('Image'), 'icon-[lucide--image]'),
    ])
    const densityItems = computed(() => [
        item('compact', t('Compact')),
        item('comfortable', t('Comfortable')),
        item('spacious', t('Spacious')),
    ])
    const languageItems = [item('en', 'English'), item('ru', 'Русский')]

    // The theme reveal grows from the press, which lands before the group emits.
    let pressed: RevealOrigin
    function rememberPress(event: PointerEvent) {
        pressed = event
    }
    function setMode(value: PrefValue<'mode'>) {
        mode.set(value, pressed)
        pressed = undefined
    }

    const tintOn = computed(() => tint.state.value === 'on')
    function setTint(on: boolean) {
        tint.set(on ? 'on' : 'off')
    }

    const radiusPx = computed(() => Number(radius.state.value))
    function setRadius(px: number) {
        radius.set(String(px))
    }

    function setLanguage(value: PrefValue<'language'>) {
        language.set(value)
        locale.value = value
    }

    const isImage = computed(() => background.state.value === 'image')
    const imageName = computed(() => image.name.value ?? t('Sample image'))
    const hasCustomImage = computed(() => image.name.value !== null)
    const suggestGlass = computed(() => surface.state.value !== 'glass')

    function pickImage() {
        openFilePicker({
            accept: 'image/*',
            onPick: ([file]) => {
                if (file === undefined) return
                image.upload(file).catch((error) => {
                    reportError(error, 'settings.background')
                })
            },
        })
    }

    return {
        mode: mode.state,
        modeItems,
        rememberPress,
        setMode,
        accent: accent.state,
        setAccent: accent.set,
        tintOn,
        setTint,
        surface: surface.state,
        surfaceItems,
        setSurface: surface.set,
        background: background.state,
        backgroundItems,
        setBackground: background.set,
        image,
        isImage,
        imageName,
        hasCustomImage,
        suggestGlass,
        pickImage,
        radiusPx,
        setRadius,
        density: density.state,
        densityItems,
        setDensity: density.set,
        motionReduced: motion.reduced,
        setMotionReduced: motion.setReduced,
        language: language.state,
        languageItems,
        setLanguage,
    }
}
