import { idb } from './idb'

const IMAGES = 'images'

// Apart from the vault's database: unlock never reads it.
const db = idb('steam-organizer-appearance', 1, (opened) => {
    opened.createObjectStore(IMAGES)
})

/** The pictures this device paints behind the app, by id: its own upload and the presets' pictures it holds. */
export const backgroundStore = {
    read: (id: string) =>
        db.read<Blob | undefined>(IMAGES, (store) => store.get(id)),
    has: async (id: string) =>
        (await db.read<number>(IMAGES, (store) => store.count(id))) > 0,
    write: (id: string, image: Blob) =>
        db.write(IMAGES, (store) => store.put(image, id)),
    remove: (id: string) => db.write(IMAGES, (store) => store.delete(id)),
}
