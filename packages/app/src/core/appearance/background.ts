import { backgroundStore } from '@so/core'

import { reportError } from '../reportError'
import {
    BG_BLUR_STORAGE_KEY,
    BG_DIM_STORAGE_KEY,
    BG_NAME_STORAGE_KEY,
    readStored,
    removeStored,
    writeStored,
} from '../storage'
import sampleUrl from './sample-bg.svg?url'

export const BLUR_DEFAULT = 28
export const DIM_DEFAULT = 40
const UPLOAD_WIDTH = 1280
// Blurred once on a canvas at half size; the stage only paints the result.
const STAGE_WIDTH = 640

let source: (CanvasImageSource & { width: number; height: number }) | undefined
// Bumped as each load, upload or reset starts, so a slower earlier one never overwrites a newer picture.
let generation = 0
let stageUrl: string | null = null

function readNumber(key: string, fallback: number): number {
    const raw = readStored(key)
    const value = raw === null ? Number.NaN : Number(raw)
    return Number.isFinite(value) ? value : fallback
}

export const readBlur = () => readNumber(BG_BLUR_STORAGE_KEY, BLUR_DEFAULT)
export const readDim = () => readNumber(BG_DIM_STORAGE_KEY, DIM_DEFAULT)
export const readImageName = () => readStored(BG_NAME_STORAGE_KEY)

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Background image failed to load'))
        img.src = src
    })
}

const jpeg = (canvas: HTMLCanvasElement) =>
    new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
    )

function applyDim(dim: number) {
    document.documentElement.style.setProperty('--stage-dim', `${dim}%`)
}

// A function, so the else branch keeps the full context type.
function hasCanvasFilter(context: CanvasRenderingContext2D): boolean {
    return 'filter' in context
}

/** Paints the blurred source into `--stage-image`; the kit's `data-bg="image"` stage reads it. */
function renderBackground(blur: number) {
    if (source === undefined) return
    const width = STAGE_WIDTH
    const height = Math.round((source.height / source.width) * width)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (context === null) return
    const radius = (blur * width) / UPLOAD_WIDTH
    // Overdraw so the blur does not fade out at the edges.
    const pad = radius * 3
    if (hasCanvasFilter(context)) {
        context.filter = radius > 0 ? `blur(${radius}px)` : 'none'
        context.drawImage(source, -pad, -pad, width + pad * 2, height + pad * 2)
    } else {
        // Safari has no canvas filter: a shrink-and-stretch smears the picture instead.
        const small = document.createElement('canvas')
        const shrink = 1 + radius
        small.width = Math.max(1, Math.round(width / shrink))
        small.height = Math.max(1, Math.round(height / shrink))
        small
            .getContext('2d')
            ?.drawImage(source, 0, 0, small.width, small.height)
        context.imageSmoothingQuality = 'high'
        context.drawImage(small, -pad, -pad, width + pad * 2, height + pad * 2)
    }
    void jpeg(canvas).then((blob) => {
        if (blob === null) return
        const previous = stageUrl
        stageUrl = URL.createObjectURL(blob)
        document.documentElement.style.setProperty(
            '--stage-image',
            `url("${stageUrl}")`,
        )
        if (previous !== null) URL.revokeObjectURL(previous)
    })
}

/** Loads the stored picture, or the generated sample when there is none or it fails. */
async function loadBackground() {
    const mine = ++generation
    let loaded: HTMLImageElement
    let url: string | undefined
    try {
        const stored = await backgroundStore.read()
        if (stored) url = URL.createObjectURL(stored)
        loaded = await loadImage(url ?? sampleUrl)
    } catch (error) {
        reportError(error, 'appearance.background')
        loaded = await loadImage(sampleUrl)
    } finally {
        if (url) URL.revokeObjectURL(url)
    }
    if (mine !== generation) return
    source = loaded
    renderBackground(readBlur())
}

let restored = false

/** Applies the stored dim and loads the picture once; the stage shows nothing until the render lands. */
export async function restoreBackground() {
    if (restored) return
    restored = true
    applyDim(readDim())
    await loadBackground()
}

/** Downsizes the picked file to the stored width, remembers it and renders it; false once a later change took over. */
export async function uploadBackground(file: File) {
    const mine = ++generation
    const url = URL.createObjectURL(file)
    try {
        const img = await loadImage(url)
        const canvas = document.createElement('canvas')
        canvas.width = UPLOAD_WIDTH
        canvas.height = Math.round((img.height / img.width) * UPLOAD_WIDTH)
        canvas
            .getContext('2d')
            ?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const image = await jpeg(canvas)
        if (image === null) throw new Error('Background image failed to encode')
        if (mine !== generation) return false
        // A reset started meanwhile clears after this write: IndexedDB runs them in order.
        await backgroundStore.write(image)
        if (mine !== generation) return false
        writeStored(BG_NAME_STORAGE_KEY, file.name)
        source = canvas
        renderBackground(readBlur())
        return true
    } finally {
        URL.revokeObjectURL(url)
    }
}

export function setBlur(blur: number) {
    writeStored(BG_BLUR_STORAGE_KEY, String(blur))
    renderBackground(blur)
}

export function setDim(dim: number) {
    writeStored(BG_DIM_STORAGE_KEY, String(dim))
    applyDim(dim)
}

/** Back to the sample; false once a later upload took over. */
export async function resetBackground() {
    const mine = ++generation
    await backgroundStore.clear()
    if (mine !== generation) return false
    removeStored(BG_NAME_STORAGE_KEY)
    await loadBackground()
    return true
}
