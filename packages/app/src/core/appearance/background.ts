import { backgroundStore } from '@so/core'

import { reportError } from '../reportError'
import {
    BG_BLUR_STORAGE_KEY,
    BG_DIM_STORAGE_KEY,
    BG_NAME_STORAGE_KEY,
    BG_PICTURE_STORAGE_KEY,
    parseRecord,
    readStored,
    removeStored,
    writeStored,
} from '../storage'
import { GRID_COLS, GRID_ROWS, gridOf, gridPixels } from './pictureGrid'
import sampleUrl from './sample-bg.svg?url'

export const BLUR_DEFAULT = 28
export const DIM_DEFAULT = 40
export const BLUR_MAX = 60
export const DIM_MAX = 85
const UPLOAD_WIDTH = 1280
// Blurred once on a canvas at half size; the stage only paints the result.
const STAGE_WIDTH = 640

/** A background picture: its id in the device cache and its colour grid, painted until it is there. */
export interface Picture {
    id: string
    colors: string
}

// `own`: this device's upload, dropped from the cache once replaced; a preset's picture stays.
interface Current extends Picture {
    own: boolean
}

type Source = CanvasImageSource & { width: number; height: number }

let source: Source | undefined
// Bumped as each load, upload or reset starts, so a slower earlier one never overwrites a newer picture.
let generation = 0
// Bumped by every render, so a slower earlier encode never replaces a newer stage image.
let renders = 0
let stageUrl: string | null = null

function readNumber(key: string, fallback: number): number {
    const raw = readStored(key)
    const value = raw === null ? Number.NaN : Number(raw)
    return Number.isFinite(value) ? value : fallback
}

export const readBlur = () => readNumber(BG_BLUR_STORAGE_KEY, BLUR_DEFAULT)
export const readDim = () => readNumber(BG_DIM_STORAGE_KEY, DIM_DEFAULT)
export const readImageName = () => readStored(BG_NAME_STORAGE_KEY)

function readCurrent(): Current | null {
    const { id, colors, own } = parseRecord(readStored(BG_PICTURE_STORAGE_KEY))
    return typeof id === 'string' && typeof colors === 'string'
        ? { id, colors, own: own === true }
        : null
}

/** The picture painted now; null is the sample. */
export function readPicture(): Picture | null {
    const current = readCurrent()
    return current && { id: current.id, colors: current.colors }
}

/** False when storage refused the write: the previous picture stays current and keeps its bytes. */
function replaceCurrent(next: Current | null): boolean {
    const previous = readCurrent()
    const text = next && JSON.stringify(next)
    if (text) writeStored(BG_PICTURE_STORAGE_KEY, text)
    else removeStored(BG_PICTURE_STORAGE_KEY)
    if (readStored(BG_PICTURE_STORAGE_KEY) !== text) return false
    if (previous?.own && previous.id !== next?.id)
        backgroundStore
            .remove(previous.id)
            .catch((error) => reportError(error, 'appearance.background'))
    return true
}

function colorsOf(image: Source): string {
    const canvas = document.createElement('canvas')
    canvas.width = GRID_COLS * 8
    canvas.height = GRID_ROWS * 8
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (context === null) return ''
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
    return gridOf(data, canvas.width, canvas.height)
}

// Upscaled by the stage render, the grid reads as the picture blurred.
function gridCanvas(colors: string): Source {
    const canvas = document.createElement('canvas')
    canvas.width = GRID_COLS
    canvas.height = GRID_ROWS
    canvas
        .getContext('2d')
        ?.putImageData(
            new ImageData(gridPixels(colors), GRID_COLS, GRID_ROWS),
            0,
            0,
        )
    return canvas
}

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
    const mine = ++renders
    void jpeg(canvas).then((blob) => {
        if (blob === null || mine !== renders) return
        const previous = stageUrl
        stageUrl = URL.createObjectURL(blob)
        document.documentElement.style.setProperty(
            '--stage-image',
            `url("${stageUrl}")`,
        )
        if (previous !== null) URL.revokeObjectURL(previous)
    })
}

/** Paints the current picture from the cache, its colours while it is not there, or the sample; true once the picture itself shows. */
async function loadBackground(): Promise<boolean> {
    const mine = ++generation
    const current = readCurrent()
    const stand = () =>
        current ? gridCanvas(current.colors) : loadImage(sampleUrl)
    let loaded: Source
    let cached = false
    let url: string | undefined
    try {
        const stored = current && (await backgroundStore.read(current.id))
        if (stored) url = URL.createObjectURL(stored)
        loaded = url ? await loadImage(url) : await stand()
        cached = url !== undefined
    } catch (error) {
        reportError(error, 'appearance.background')
        loaded = await stand()
    } finally {
        if (url) URL.revokeObjectURL(url)
    }
    if (mine !== generation) return false
    source = loaded
    renderBackground(readBlur())
    return cached || current === null
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
        const id = crypto.randomUUID()
        await backgroundStore.write(id, image)
        // Another change took over meanwhile: this picture never showed.
        if (mine !== generation) {
            await backgroundStore.remove(id)
            return false
        }
        if (!replaceCurrent({ id, colors: colorsOf(canvas), own: true })) {
            await backgroundStore.remove(id)
            throw new Error('Background picture could not be stored')
        }
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

/** Makes `picture` the one painted (null: the sample), named `name` in Settings; false while it is not in the cache. */
export async function showPicture(
    picture: Picture | null,
    name: string | null,
) {
    replaceCurrent(picture && { ...picture, own: false })
    if (name === null) removeStored(BG_NAME_STORAGE_KEY)
    else writeStored(BG_NAME_STORAGE_KEY, name)
    return loadBackground()
}

/** The current picture, now a preset's: it stays in the cache when another replaces it. */
export function keepPicture(): Picture | null {
    const current = readCurrent()
    if (current?.own)
        writeStored(
            BG_PICTURE_STORAGE_KEY,
            JSON.stringify({ ...current, own: false }),
        )
    return current && { id: current.id, colors: current.colors }
}
