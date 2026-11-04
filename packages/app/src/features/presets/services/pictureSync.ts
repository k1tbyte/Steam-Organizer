import {
    type PresetImageFile,
    readPreset,
    type SealedRecord,
    TOMBSTONE_TTL_MS,
} from '@so/core'

/** What a sync does with the vault's picture files in Drive. */
export interface PicturePlan {
    /** A picture this device holds and Drive lacks: written over the preset's file, else a new one. */
    upload: { presetId: string; imageId: string; fileId?: string }[]
    remove: string[]
}

/** Each live preset's picture id, by preset id. */
export function presetPictures(
    data: ReadonlyMap<string, unknown>,
): Map<string, string> {
    const pictures = new Map<string, string>()
    for (const [id, value] of data) {
        const image = readPreset(value)?.image
        if (image) pictures.set(id, image.id)
    }
    return pictures
}

/** One file per preset. A deleted preset's file goes once its tombstone could be purged, an unknown preset's (a record not
 *  merged here yet) once the file is that old: Undo, a recent backup and a late merge still find theirs. */
export function picturePlan(
    files: readonly PresetImageFile[],
    records: readonly SealedRecord[],
    data: ReadonlyMap<string, unknown>,
    held: ReadonlySet<string>,
    now: number,
): PicturePlan {
    const pictures = presetPictures(data)
    const byPreset = Map.groupBy(files, (file) => file.presetId)
    const upload: PicturePlan['upload'] = []
    // Files whose picture leaves Drive: written over by an upload, or dropped (null).
    const leaving = new Map<
        PresetImageFile,
        PicturePlan['upload'][number] | null
    >()
    for (const [presetId, imageId] of pictures) {
        const own = byPreset.get(presetId) ?? []
        const target =
            own.find((file) => file.imageId === imageId) ??
            own.toSorted((a, b) => b.modifiedAt - a.modifiedAt)[0]
        if (target?.imageId !== imageId && held.has(imageId)) {
            const step = { presetId, imageId, fileId: target?.id }
            upload.push(step)
            if (target) leaving.set(target, step)
        }
        for (const file of own) if (file !== target) leaving.set(file, null)
    }
    const known = new Map(records.map((record) => [record.id, record]))
    for (const [presetId, own] of byPreset) {
        if (pictures.has(presetId)) continue
        const record = known.get(presetId)
        // A live preset without a picture took its file off; a tombstone dates the deletion.
        const since =
            record && !('deleted' in record)
                ? Number.NEGATIVE_INFINITY
                : (record?.updatedAt ??
                  Math.max(...own.map((f) => f.modifiedAt)))
        if (now - since > TOMBSTONE_TTL_MS)
            for (const file of own) leaving.set(file, null)
    }
    // Save as new shares a picture id: the last copy of a picture a live preset names stays.
    const wanted = new Set(pictures.values())
    const kept = new Set(
        files.filter((file) => !leaving.has(file)).map((file) => file.imageId),
    )
    const remove: string[] = []
    for (const [file, step] of leaving) {
        if (wanted.has(file.imageId) && !kept.has(file.imageId)) {
            kept.add(file.imageId)
            if (step) step.fileId = undefined
        } else if (!step) remove.push(file.id)
    }
    return { upload, remove }
}

export type PictureStatus = 'waiting' | 'loading' | 'offline' | 'missing'

/** What a preset's tile says of its picture; null: nothing worth saying. `held` and `listed` are undefined until known. */
export function pictureStatus(picture: {
    held: boolean | undefined
    loading: boolean
    listed: boolean | undefined
    synced: boolean
    connected: boolean
    followed: boolean
}): PictureStatus | null {
    const { held, listed, synced } = picture
    if (picture.loading) return 'loading'
    if (held === undefined) return null
    if (held) return synced && listed === false ? 'waiting' : null
    if (!synced || listed === false) return 'missing'
    return picture.followed && !picture.connected ? 'offline' : null
}
