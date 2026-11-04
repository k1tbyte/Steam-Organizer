import { idb } from './idb'

const IMAGES = 'images'
const BACKGROUND = 'background'

// Apart from the vault's database: unlock never reads it.
const db = idb('steam-organizer-appearance', 1, (opened) => {
    opened.createObjectStore(IMAGES)
})

/** The picture this device paints behind the app: device-only, never synced. */
export const backgroundStore = {
    read: () =>
        db.read<Blob | undefined>(IMAGES, (store) => store.get(BACKGROUND)),
    write: (image: Blob) =>
        db.write(IMAGES, (store) => store.put(image, BACKGROUND)),
    clear: () => db.write(IMAGES, (store) => store.delete(BACKGROUND)),
}
