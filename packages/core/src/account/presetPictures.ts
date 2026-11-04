import type { VaultKey } from '../crypto/kdf'
import { backgroundStore } from '../storage/backgroundStore'
import {
    type LiveRecord,
    openData,
    type SealedRecord,
    updateData,
} from '../vault/vault'
import { type PresetData, readPreset } from './records'

// Same stamp: the record holds the same state, only its picture rides along or leaves.
const reseal = (key: VaultKey, record: LiveRecord, data: PresetData) =>
    updateData(key, record, data, record.updatedAt)

/** A whole export's records: each preset whose picture this device holds carries it; `data` is the open contents. */
export async function withPictures(
    key: VaultKey,
    records: readonly SealedRecord[],
    data: ReadonlyMap<string, unknown>,
): Promise<{ records: SealedRecord[]; carried: boolean }> {
    let carried = false
    const out = await Promise.all(
        records.map(async (record) => {
            const preset = readPreset(data.get(record.id))
            const image = preset?.image
            if ('deleted' in record || !preset || !image) return record
            const blob = await backgroundStore.read(image.id)
            if (!blob) return record
            carried = true
            const bytes = new Uint8Array(await blob.arrayBuffer()).toBase64()
            return reseal(key, record, {
                ...preset,
                image: { ...image, bytes },
            })
        }),
    )
    return { records: out, carried }
}

// Optional: a picture that can't be cached (quota, bad base64) shows as its colours, and the import goes on.
const cache = async (id: string, bytes: string) =>
    backgroundStore.write(
        id,
        new Blob([Uint8Array.fromBase64(bytes)], { type: 'image/jpeg' }),
    )

/** Records as a device stores them: a picture inside a preset moves to this device's cache. */
export async function takePictures(
    key: VaultKey,
    records: readonly SealedRecord[],
): Promise<{ records: SealedRecord[]; taken: boolean }> {
    let taken = false
    const out = await Promise.all(
        records.map(async (record) => {
            if ('deleted' in record) return record
            const preset = readPreset(await openData(key, record))
            if (!preset?.image?.bytes) return record
            const { bytes, ...image } = preset.image
            await cache(image.id, bytes).catch(() => undefined)
            taken = true
            return reseal(key, record, { ...preset, image })
        }),
    )
    return { records: out, taken }
}
