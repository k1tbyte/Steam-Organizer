import { ref } from 'vue'

import {
    readBlur,
    readDim,
    readImageName,
    resetBackground,
    restoreBackground,
    setBlur as storeBlur,
    setDim as storeDim,
    uploadBackground,
} from './background'

const name = ref<string | null>(readImageName())
const blur = ref(readBlur())
const dim = ref(readDim())

/** The Image background's picture, blur and dim: stored on this device, never synced. */
export function useBackgroundImage() {
    // The stage image is rendered on demand, so the Image preview has something to show.
    void restoreBackground()

    async function upload(file: File) {
        await uploadBackground(file)
        name.value = file.name
    }

    async function resetToSample() {
        await resetBackground()
        name.value = null
    }

    function setBlur(value: number) {
        blur.value = value
        storeBlur(value)
    }

    function setDim(value: number) {
        dim.value = value
        storeDim(value)
    }

    return { name, blur, dim, upload, resetToSample, setBlur, setDim }
}
