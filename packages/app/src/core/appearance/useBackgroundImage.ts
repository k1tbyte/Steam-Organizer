import { readonly, ref } from 'vue'

import {
    keepPicture,
    type Picture,
    readBlur,
    readDim,
    readImageName,
    readPicture,
    restoreBackground,
    showPicture,
    setBlur as storeBlur,
    setDim as storeDim,
    uploadBackground,
} from './background'

const name = ref<string | null>(readImageName())
const blur = ref(readBlur())
const dim = ref(readDim())
const picture = ref<Picture | null>(readPicture())

/** The Image background's picture, blur and dim, shared: stored on this device, never synced on their own. */
export const backgroundImage = {
    name: readonly(name),
    blur: readonly(blur),
    dim: readonly(dim),
    /** Null is the sample. */
    picture: readonly(picture),

    async upload(file: File) {
        if (!(await uploadBackground(file))) return
        name.value = file.name
        picture.value = readPicture()
    },

    /** Paints `next` (null: the sample) named `label`; false while it is not cached, so its colours show. */
    show(next: Picture | null, label: string | null) {
        name.value = label
        picture.value = next
        return showPicture(next, label)
    },

    keep: keepPicture,

    setBlur(value: number) {
        if (value === blur.value) return
        blur.value = value
        storeBlur(value)
    },

    setDim(value: number) {
        if (value === dim.value) return
        dim.value = value
        storeDim(value)
    },
}

/** The Image background's controls in Settings. */
export function useBackgroundImage() {
    // The stage image is rendered on demand, so the Image preview has something to show.
    void restoreBackground()
    return {
        ...backgroundImage,
        resetToSample: () => backgroundImage.show(null, null),
    }
}
