import { expect, it } from 'vitest'

import type { VaultKey } from '../crypto/kdf'
import type { DriveFile } from './drive'
import { listImages, openImage, saveImage, sealImage } from './presetImages'

function fakeDrive() {
    const files: (DriveFile & { body: Uint8Array<ArrayBuffer> })[] = []
    return {
        files,
        async list(properties: Record<string, string>) {
            return files.filter((file) =>
                Object.entries(properties).every(
                    ([key, value]) => file.appProperties[key] === value,
                ),
            )
        },
        async create(
            name: string,
            appProperties: Record<string, string>,
            body: Uint8Array<ArrayBuffer>,
        ) {
            const file = {
                id: `f${files.length}`,
                name,
                size: body.length,
                createdTime: files.length,
                modifiedTime: files.length,
                version: '1',
                appProperties,
                body,
            }
            files.push(file)
            return file
        },
        async update(
            id: string,
            appProperties: Record<string, string>,
            body: Uint8Array<ArrayBuffer>,
        ) {
            const file = files.find((item) => item.id === id)
            if (!file) throw new Error('not found')
            Object.assign(file, { body, appProperties })
            return file
        },
    }
}

const key = async () =>
    ({
        records: await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'],
        ),
    }) as VaultKey

const place = { vaultId: 'v1', presetId: 'p1', imageId: 'i1' }
const bytes = new Uint8Array([1, 2, 3])

it('keeps one file per preset, written over in place', async () => {
    const drive = fakeDrive()
    const sealed = await sealImage(await key(), place, bytes)
    const first = await saveImage(drive, place, sealed)
    await saveImage(drive, { ...place, presetId: 'p2' }, sealed)
    await saveImage(drive, { ...place, vaultId: 'v2' }, sealed)
    const second = await saveImage(
        drive,
        { ...place, imageId: 'i2' },
        sealed,
        first.id,
    )
    expect(second.id).toBe(first.id)
    expect(
        (await listImages(drive, 'v1')).map(({ presetId, imageId }) => [
            presetId,
            imageId,
        ]),
    ).toEqual([
        ['p1', 'i2'],
        ['p2', 'i1'],
    ])
})

it('opens a picture only in its own vault and place', async () => {
    const vault = await key()
    const sealed = await sealImage(vault, place, bytes)
    expect(await openImage(vault, place, sealed)).toEqual(bytes)
    await expect(
        openImage(vault, { ...place, imageId: 'i2' }, sealed),
    ).rejects.toThrow()
    await expect(
        openImage(vault, { ...place, vaultId: 'v2' }, sealed),
    ).rejects.toThrow()
    await expect(openImage(await key(), place, sealed)).rejects.toThrow()
})
