import type { VaultKey } from '../crypto/kdf'
import { openRaw, sealRaw } from '../crypto/seal'
import type { DriveApi, DriveFile } from './drive'

/** A preset's picture in the app's Drive folder: one file per preset, written over when its picture changes. */
export interface PresetImageFile {
    id: string
    vaultId: string
    presetId: string
    imageId: string
    modifiedAt: number
}

export interface PresetImagePlace {
    vaultId: string
    presetId: string
    imageId: string
}

const TYPE = 'preset-image'

const toImage = ({ id, appProperties, modifiedTime }: DriveFile) => ({
    id,
    vaultId: appProperties.vault ?? '',
    presetId: appProperties.preset ?? '',
    imageId: appProperties.image ?? '',
    modifiedAt: modifiedTime,
})

// Bound to the vault and the picture: a file never opens as another picture.
const aad = (vaultId: string, imageId: string) =>
    `preset-image:${vaultId}:${imageId}`

export const sealImage = (
    key: VaultKey,
    { vaultId, imageId }: PresetImagePlace,
    bytes: Uint8Array<ArrayBuffer>,
) => sealRaw(key.records, bytes, aad(vaultId, imageId))

export const openImage = (
    key: VaultKey,
    { vaultId, imageId }: PresetImagePlace,
    sealed: Uint8Array<ArrayBuffer>,
) => openRaw(key.records, sealed, aad(vaultId, imageId))

export async function listImages(
    api: Pick<DriveApi, 'list'>,
    vaultId: string,
): Promise<PresetImageFile[]> {
    return (await api.list({ type: TYPE, vault: vaultId })).map(toImage)
}

/** Writes over file `id`, or creates the preset's file without one. */
export async function saveImage(
    api: Pick<DriveApi, 'create' | 'update'>,
    place: PresetImagePlace,
    sealed: Uint8Array<ArrayBuffer>,
    id?: string,
): Promise<PresetImageFile> {
    const properties = {
        type: TYPE,
        vault: place.vaultId,
        preset: place.presetId,
        image: place.imageId,
    }
    return toImage(
        id
            ? await api.update(id, properties, sealed)
            : await api.create('preset-image.bin', properties, sealed),
    )
}
