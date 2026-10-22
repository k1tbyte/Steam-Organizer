import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getIconData, iconToSVG } from '@iconify/utils'

const ICON = /icon-\[([a-z0-9-]+)--([a-z0-9-]+)\]/g
const SOURCE = /\.(vue|ts)$/
const path = (url) =>
    fileURLToPath(new URL(url, import.meta.url)).replaceAll('\\', '/')
const MAP = path('../src/components/display/media/icons.ts')
const KIT = path('../src')
const require = createRequire(import.meta.url)

function loadSet(prefix) {
    try {
        return require(`@iconify-json/${prefix}/icons.json`)
    } catch {
        return null
    }
}

/** @param {{ sources?: string[] }} [options] */
export function fpIcons({ sources = [] } = {}) {
    const names = new Map()
    let roots = [KIT]

    // True when the code names an icon the map lacks.
    const scan = (code) => {
        let grew = false
        for (const [name, prefix, icon] of code.matchAll(ICON)) {
            if (names.has(name)) continue
            names.set(name, [prefix, icon])
            grew = true
        }
        return grew
    }

    return {
        name: 'fp-icons',
        enforce: 'pre',
        configResolved(config) {
            roots = [
                KIT,
                ...sources.map((dir) =>
                    resolve(config.root, dir).replaceAll('\\', '/'),
                ),
            ]
        },
        buildStart() {
            for (const root of roots) {
                for (const entry of readdirSync(root, {
                    recursive: true,
                    withFileTypes: true,
                })) {
                    if (entry.isFile() && SOURCE.test(entry.name))
                        scan(
                            readFileSync(
                                join(entry.parentPath, entry.name),
                                'utf8',
                            ),
                        )
                }
            }
        },
        load(id) {
            if (id !== MAP) return
            const sets = new Map()
            const glyphs = {}
            for (const [name, [prefix, icon]] of names) {
                if (!sets.has(prefix)) sets.set(prefix, loadSet(prefix))
                const set = sets.get(prefix)
                const data = set && getIconData(set, icon)
                if (!data) {
                    this.warn(`unknown icon ${name}`)
                    continue
                }
                const { attributes, body } = iconToSVG(data)
                glyphs[name] = { viewBox: attributes.viewBox, body }
            }
            return `export const icons = ${JSON.stringify(glyphs)}`
        },
        // Dev: a module first loaded or edited after the start scan may name a new icon.
        transform(code, id) {
            if (this.environment.mode !== 'dev') return
            const file = id.split('?')[0]
            if (
                !SOURCE.test(file) ||
                !roots.some((root) => file.startsWith(`${root}/`)) ||
                !scan(code)
            )
                return
            const map = this.environment.moduleGraph.getModuleById(MAP)
            if (map) this.environment.reloadModule(map)
        },
    }
}
