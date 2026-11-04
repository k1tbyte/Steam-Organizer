import { type LiveRecord, readPreset, sealRecord, updateData } from '@so/core'
import type { RevealOrigin } from '@so/ui/theme-reveal'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { backgroundImage, parseLook, sameLook, useLook } from '#core'
import {
    useUndoDelete,
    useVaultSession,
    type VaultContents,
} from '#features/vault'

import { BUILT_IN_PRESETS, type Preset } from '../model'
import {
    findPreset,
    ownPresets,
    pictureOf,
    presetData,
    presetName,
} from '../services/presets'
import { usePresetFollow } from '../stores/usePresetFollow'
import { usePresetPictures } from '../stores/usePresetPictures'

function livePreset(contents: VaultContents, id: string) {
    const record = contents.records.find((found) => found.id === id)
    const data = readPreset(contents.data.get(id))
    return record && !('deleted' in record) && data ? { record, data } : null
}

/** Built-in presets and the vault's: the one writer of PRESET records and of what this device follows. */
export function usePresets() {
    const { t } = useI18n()
    const session = useVaultSession()
    const follows = usePresetFollow()
    const pictures = usePresetPictures()
    const deleteWithUndo = useUndoDelete()
    const { look, apply: applyLook } = useLook()

    const builtIn = computed<Preset[]>(() =>
        BUILT_IN_PRESETS.map((preset) => ({
            id: preset.id,
            name: t(preset.name),
            look: parseLook(preset.look),
            image: null,
            builtIn: true,
        })),
    )
    const listed = (contents: VaultContents | null) => [
        ...builtIn.value,
        ...(contents ? ownPresets(contents.data) : []),
    ]
    const presets = computed(() => listed(session.contents))

    const vaultId = computed(() => session.vault?.id ?? null)
    const follow = computed(() =>
        follows.follow?.vaultId === vaultId.value ? follows.follow : null,
    )
    /** A deleted one reads as none; Undo brings it back. */
    const followed = computed(
        () =>
            presets.value.find((p) => p.id === follow.value?.presetId) ?? null,
    )
    /** This device changed the look it put on: edits made elsewhere stop arriving. */
    const modified = computed(() => {
        const from = follow.value
        const picture = pictureOf(look.value, backgroundImage.picture.value?.id)
        return (
            from !== null &&
            !(sameLook(look.value, from.look) && picture === from.picture)
        )
    })

    /** The device wears this preset now: its look and picture. */
    const wears = (preset: Preset) =>
        sameLook(look.value, preset.look) &&
        pictureOf(look.value, backgroundImage.picture.value?.id) ===
            pictureOf(preset.look, preset.image?.id)

    function followAs(preset: Preset) {
        if (vaultId.value)
            follows.set({
                vaultId: vaultId.value,
                presetId: preset.id,
                look: preset.look,
                picture: pictureOf(preset.look, preset.image?.id),
            })
    }

    function apply(preset: Preset, origin?: RevealOrigin) {
        applyLook(preset.look, origin, () => {
            followAs(preset)
            // Painted even when it is the current picture: the stage may never have loaded one.
            if (preset.look.background === 'image')
                return backgroundImage
                    .show(preset.image, preset.image && preset.name)
                    .then((painted) => {
                        // Its colours show meanwhile; Drive brings the picture.
                        if (!painted && preset.image)
                            void pictures.fetch(preset.image)
                    })
        })
    }

    /** The current look, its picture kept in the cache once a preset holds it. */
    function wearing(name: string, id: string): Preset {
        const current = look.value
        const image =
            current.background === 'image' ? backgroundImage.keep() : null
        if (image) void pictures.refresh([image.id])
        return { id, name, look: current, image, builtIn: false }
    }

    /** False when the name is taken. The device follows the new preset. */
    async function save(text: string): Promise<boolean> {
        const name = presetName(text)
        let saved: Preset | null = null
        await session.transact(async (contents, key) => {
            if (!name || findPreset(listed(contents), name)) return []
            const preset = wearing(name, '')
            const record = await sealRecord(key, {
                id: crypto.randomUUID(),
                updatedAt: Date.now(),
                data: presetData(name, preset.look, preset.image),
            })
            saved = { ...preset, id: record.id }
            return [record]
        })
        if (saved) followAs(saved)
        return saved !== null
    }

    /** Takes the current look; a device that followed it follows again. */
    async function update(id: string) {
        let updated: Preset | null = null
        await session.transact(async (contents, key) => {
            const live = livePreset(contents, id)
            if (!live) return []
            const preset = wearing(live.data.name, id)
            updated = preset
            const data = presetData(preset.name, preset.look, preset.image)
            return [await updateData(key, live.record, data, Date.now())]
        })
        if (updated && follow.value?.presetId === id) followAs(updated)
    }

    /** False when another preset holds the name. */
    async function rename(id: string, text: string): Promise<boolean> {
        const name = presetName(text)
        let saved = true
        await session.transact(async (contents, key) => {
            const live = livePreset(contents, id)
            if (!live || !name) return []
            const holder = findPreset(listed(contents), name)
            saved = !holder || holder.id === id
            if (!saved) return []
            const data = { ...live.data, name }
            return [await updateData(key, live.record, data, Date.now())]
        })
        return saved
    }

    function remove(preset: Preset) {
        void deleteWithUndo({
            title: t('Deleted “{name}”', { name: preset.name }),
            failed: t("Couldn't delete the preset"),
            scope: 'presets.remove',
            remove: async () => {
                let taken: LiveRecord | undefined
                let name = ''
                await session.transact(async (contents) => {
                    const live = livePreset(contents, preset.id)
                    taken = live?.record
                    name = live?.data.name ?? ''
                    return taken
                        ? [
                              {
                                  id: preset.id,
                                  updatedAt: Date.now(),
                                  deleted: true as const,
                              },
                          ]
                        : []
                })
                // The same sealed record, newer than its tombstone; a preset that took the name meanwhile keeps it.
                return () =>
                    session.transact(async (contents) =>
                        !taken || findPreset(listed(contents), name)
                            ? []
                            : [{ ...taken, updatedAt: Date.now() }],
                    )
            },
        })
    }

    return {
        presets,
        look,
        follow,
        followed,
        modified,
        wears,
        apply,
        save,
        update,
        rename,
        remove,
    }
}
