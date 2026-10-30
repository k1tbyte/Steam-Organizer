// A fresh input lets the same rejected file fire change again.
// Call this only from a user gesture.
export function openFilePicker(options: {
    accept: string
    multiple?: boolean
    onPick: (files: File[]) => void
}): void {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = options.accept
    input.multiple = options.multiple === true
    input.addEventListener('change', () => {
        const files = Array.from(input.files ?? [])
        if (files.length > 0) options.onPick(files)
    })
    input.click()
}

export function saveFile(name: string, content: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    // Revoked late: a browser may read the blob after the click returns.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
