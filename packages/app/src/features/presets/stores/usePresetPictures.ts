import {
    backgroundStore,
    type DriveApi,
    DriveError,
    listImages,
    openImage,
    type PresetImageFile,
    removeFile,
    saveImage,
    sealImage,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, reactive, shallowRef } from 'vue'

import { backgroundImage, type Picture, reportError } from '#core'
import { useDrive } from '#features/drive'
import { useVaultSession } from '#features/vault'

import { picturePlan, presetPictures } from '../services/pictureSync'

const failed = (error: unknown) => {
    if (!(error instanceof DriveError)) reportError(error, 'presets.pictures')
}

/** Preset pictures in Drive: the open vault's files, which pictures this device holds, the downloads running. */
export const usePresetPictures = defineStore('preset-pictures', () => {
    const session = useVaultSession()
    const drive = useDrive()
    const listing = shallowRef<{
        vaultId: string
        files: PresetImageFile[]
    } | null>(null)
    const held = reactive(new Map<string, boolean>())
    const loading = reactive(new Set<string>())
    const opened = () => session.vault?.id

    async function refresh(ids: Iterable<string>) {
        for (const id of ids) held.set(id, await backgroundStore.has(id))
    }

    async function download(api: DriveApi, picture: Picture) {
        const vaultId = opened()
        if (!vaultId || loading.has(picture.id)) return
        loading.add(picture.id)
        try {
            const files =
                listing.value?.vaultId === vaultId
                    ? listing.value.files
                    : await listImages(api, vaultId)
            const file = files.find(({ imageId }) => imageId === picture.id)
            if (!file) return
            const sealed = await api.download(file.id)
            const bytes =
                opened() === vaultId
                    ? await session.withKey((key) =>
                          openImage(key, file, sealed),
                      )
                    : undefined
            if (!bytes) return
            await backgroundStore.write(
                picture.id,
                new Blob([bytes], { type: 'image/jpeg' }),
            )
            held.set(picture.id, true)
            if (backgroundImage.picture.value?.id === picture.id)
                await backgroundImage.show(picture, backgroundImage.name.value)
        } finally {
            loading.delete(picture.id)
        }
    }

    /** Run by the sync lane once the copy is merged and pushed; a failure waits for the next sync. */
    async function sync(api: DriveApi, vaultId: string) {
        const plan = () => {
            const contents = opened() === vaultId ? session.contents : null
            const holds = new Set(
                [...held].filter(([, on]) => on).map(([id]) => id),
            )
            return (
                contents &&
                picturePlan(
                    files,
                    contents.records,
                    contents.data,
                    holds,
                    Date.now(),
                )
            )
        }
        let files: PresetImageFile[] = []
        try {
            const contents = opened() === vaultId ? session.contents : null
            if (!contents) return
            files = await listImages(api, vaultId)
            await refresh(presetPictures(contents.data).values())
            // Each write and delete is planned again right before it: a restore meanwhile may need the file.
            for (const { presetId, imageId } of plan()?.upload ?? []) {
                const place = { vaultId, presetId, imageId }
                const blob = await backgroundStore.read(imageId)
                const plain = blob && new Uint8Array(await blob.arrayBuffer())
                // `withKey` takes the vault open now: another may have opened during the read.
                if (!plain || opened() !== vaultId) continue
                const sealed = await session.withKey((key) =>
                    sealImage(key, place, plain),
                )
                const step = plan()?.upload.find(
                    (next) =>
                        next.presetId === presetId && next.imageId === imageId,
                )
                if (!sealed || !step) continue
                const saved = await saveImage(api, place, sealed, step.fileId)
                files = [...files.filter(({ id }) => id !== saved.id), saved]
            }
            for (let id = plan()?.remove[0]; id; id = plan()?.remove[0]) {
                await removeFile(api, id)
                files = files.filter((file) => file.id !== id)
            }
            listing.value = { vaultId, files }
            const current = backgroundImage.picture.value
            if (current && !held.get(current.id)) await download(api, current)
        } catch (error) {
            failed(error)
        }
    }

    return {
        /** The open vault's picture files by image id; undefined until a sync listed them. */
        listed: computed(() => {
            const files =
                listing.value?.vaultId === opened()
                    ? listing.value?.files
                    : null
            return files && new Set(files.map(({ imageId }) => imageId))
        }),
        held: (id: string) => held.get(id),
        loading: (id: string) => loading.has(id),
        refresh,
        sync,
        /** Brings a picture this device lacks from Drive (a preset put on); offline or not synced, its colours stay. */
        async fetch(picture: Picture) {
            if (!session.vault?.sync || drive.state.value !== 'connected')
                return
            await drive.run((api) => download(api, picture)).catch(failed)
        },
    }
})
