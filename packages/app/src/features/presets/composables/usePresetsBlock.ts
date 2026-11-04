import { type MenuEntries, type RevealOrigin, useDesktopLayout } from '@so/ui'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { backgroundImage } from '#core'

import type { Preset } from '../model'
import { findPreset, presetName } from '../services/presets'
import { usePictureStatus } from './usePictureStatus'
import { usePresets } from './usePresets'

type Naming = { mode: 'save' } | { mode: 'rename'; preset: Preset }

/** The Presets block in Settings → Appearance: tiles, the follow strip, saving and renaming. */
export function usePresetsBlock() {
    const { t } = useI18n()
    const presets = usePresets()
    const desktop = useDesktopLayout()
    const pictures = usePictureStatus(() => presets.presets.value)

    const naming = ref<Naming | null>(null)
    const draft = ref('')
    const renaming = computed(() =>
        naming.value?.mode === 'rename' ? naming.value.preset : null,
    )
    const nameError = computed(() => {
        const holder = findPreset(presets.presets.value, draft.value)
        return holder && holder.id !== renaming.value?.id
            ? t('Name already in use')
            : undefined
    })
    const canSubmit = computed(
        () => presetName(draft.value) !== '' && !nameError.value,
    )

    function startSave() {
        naming.value = { mode: 'save' }
        draft.value = ''
    }
    function startRename(preset: Preset) {
        naming.value = { mode: 'rename', preset }
        draft.value = preset.name
    }
    function cancel() {
        naming.value = null
    }
    async function submit() {
        const current = naming.value
        if (!current || !canSubmit.value) return
        const done =
            current.mode === 'save'
                ? await presets.save(draft.value)
                : await presets.rename(current.preset.id, draft.value)
        // A refused name is in the vault by now: the field shows it taken.
        if (done && naming.value === current) naming.value = null
    }

    function menu(preset: Preset): MenuEntries {
        return [
            [
                {
                    label: t('Rename'),
                    icon: 'icon-[lucide--pencil]',
                    opens: true,
                    onSelect: () => startRename(preset),
                },
                {
                    label: t('Update from current look'),
                    icon: 'icon-[lucide--refresh-cw]',
                    disabled: presets.wears(preset),
                    onSelect: () => void presets.update(preset.id),
                },
            ],
            [
                {
                    label: t('Delete'),
                    icon: 'icon-[lucide--trash-2]',
                    color: 'danger',
                    onSelect: () => presets.remove(preset),
                },
            ],
        ]
    }

    const tiles = computed(() =>
        presets.presets.value.map((preset) => {
            const followed = presets.followed.value?.id === preset.id
            return {
                preset,
                on: followed && !presets.modified.value,
                modified: followed && presets.modified.value,
                renaming: renaming.value?.id === preset.id,
                menu: preset.builtIn ? null : menu(preset),
                picture: pictures.label(preset, followed),
            }
        }),
    )

    const strip = computed(() => {
        const preset = presets.followed.value
        return (
            preset && {
                name: preset.name,
                modified: presets.modified.value,
                canUpdate: !preset.builtIn,
                note: pictures.note(preset),
            }
        )
    })

    const current = computed(() => ({
        look: presets.look.value,
        image: backgroundImage.picture.value,
    }))

    /** Under the save field: where a picture saved with the preset goes. */
    const saveNote = computed(() =>
        pictures.synced.value && current.value.look.background === 'image'
            ? t(
                  'The picture is saved with the preset and goes to Google Drive with your vault.',
              )
            : undefined,
    )

    // Phones name a preset in a sheet; desktop saves in a panel and renames in the tile.
    const sheet = computed(() => {
        const preset = renaming.value
        if (desktop.value || !naming.value) return null
        return preset
            ? {
                  title: t('Rename preset'),
                  submit: t('Rename'),
                  look: preset.look,
                  image: preset.image,
                  caption: undefined,
                  note: undefined,
              }
            : {
                  title: t('Save preset'),
                  submit: t('Save'),
                  ...current.value,
                  caption: t('Current look'),
                  note: saveNote.value,
              }
    })

    return {
        tiles,
        strip,
        saveNote,
        /** The look Save would keep, for its preview. */
        current,
        sheet,
        saving: computed(() => naming.value?.mode === 'save'),
        renaming,
        draft,
        nameError,
        canSubmit,
        startSave,
        startRename,
        cancel,
        submit,
        apply(preset: Preset, origin?: RevealOrigin) {
            naming.value = null
            presets.apply(preset, origin)
        },
        updateFollowed() {
            const preset = presets.followed.value
            if (preset) void presets.update(preset.id)
        },
        revert(origin?: RevealOrigin) {
            const preset = presets.followed.value
            if (preset) presets.apply(preset, origin)
        },
    }
}
