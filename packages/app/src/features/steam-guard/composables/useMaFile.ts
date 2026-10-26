import { computed, readonly, ref, shallowRef } from 'vue'

import { fitsLogin, type MaFile, readMaFile } from '../services/maFile'

export type MaFilePick =
    | { name: string; problem: null; file: MaFile }
    | { name: string; problem: 'broken' }
    | { name: string; problem: 'another'; inFile: string }

/** A picked maFile, checked against the account's login as it is now. */
export function useMaFile(login: () => string) {
    const read = shallowRef<{ name: string; file: MaFile | null } | null>(null)
    const reading = ref(false)
    let picks = 0

    return {
        picked: computed<MaFilePick | null>(() => {
            const current = read.value
            if (!current) return null
            const { name, file } = current
            if (!file) return { name, problem: 'broken' }
            if (!fitsLogin(file, login()))
                return { name, problem: 'another', inFile: file.accountName }
            return { name, problem: null, file }
        }),
        /** A picked file is still being read: nothing can be checked yet. */
        reading: readonly(reading),
        /** Resolves to the file once read; a later pick wins over a slower earlier one. */
        async attach(picked: File | undefined) {
            if (!picked) return null
            const pick = ++picks
            reading.value = true
            const file = readMaFile(await picked.text())
            if (pick !== picks) return null
            reading.value = false
            read.value = { name: picked.name, file }
            return file
        },
        clear() {
            picks++
            reading.value = false
            read.value = null
        },
    }
}
