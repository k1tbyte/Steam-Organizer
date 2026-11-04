import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDrive } from '#features/drive'
import { useVaultSession } from '#features/vault'

import type { Preset } from '../model'
import { type PictureStatus, pictureStatus } from '../services/pictureSync'
import { usePresetPictures } from '../stores/usePresetPictures'

/** What the tiles and the follow strip say of the presets' pictures: on this device, in Drive, on the way. */
export function usePictureStatus(presets: () => readonly Preset[]) {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    const pictures = usePresetPictures()
    const synced = computed(() => Boolean(session.vault?.sync))

    const pictureOf = (preset: Preset) =>
        preset.look.background === 'image' ? preset.image : null
    watch(
        () => presets().flatMap((preset) => pictureOf(preset)?.id ?? []),
        (ids) => void pictures.refresh(ids),
        { immediate: true },
    )

    const labels = computed<Record<PictureStatus, string>>(() => ({
        waiting: t('Waiting to upload'),
        loading: t('Loading picture…'),
        offline: t('Offline · colours shown'),
        missing: t('Missing · colours shown'),
    }))
    const notes = computed<Partial<Record<PictureStatus, string>>>(() => ({
        offline: t(
            "You're offline, so its colours are shown. The picture loads when you're back.",
        ),
        missing: t(
            "The picture isn't in Google Drive or on this device, so its colours are shown.",
        ),
    }))

    function of(preset: Preset, followed: boolean): PictureStatus | null {
        const image = pictureOf(preset)
        return image
            ? pictureStatus({
                  held: pictures.held(image.id),
                  loading: pictures.loading(image.id),
                  listed: pictures.listed?.has(image.id),
                  synced: synced.value,
                  connected: drive.state.value === 'connected',
                  followed,
              })
            : null
    }

    return {
        synced,
        /** A tile's caption. */
        label: (preset: Preset, followed: boolean) => {
            const status = of(preset, followed)
            return status && { kind: status, text: labels.value[status] }
        },
        /** The follow strip's line on why the followed picture is not there. */
        note: (preset: Preset) => {
            const status = of(preset, true)
            return (status && notes.value[status]) ?? null
        },
    }
}
