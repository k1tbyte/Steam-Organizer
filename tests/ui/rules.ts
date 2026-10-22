import { globSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
    type ElementNode,
    ElementTypes,
    NodeTypes,
    parse,
    type TemplateChildNode,
} from '@vue/compiler-dom'

export interface Hit {
    file: string
    line: number
    text: string
}

export interface Rule {
    id: string
    why: string
    scan(): Hit[]
}

interface Match {
    index: number
    text: string
    capture: string
}

type Find = (src: string) => Match[]
type Visit = (node: TemplateChildNode) => string[]

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const APP = 'packages/app/src'
const UI = 'packages/ui/src'
// Shells hold no features, but their markup and styles still obey the kit.
const SHELLS = ['apps/*/src', 'apps/extension/entrypoints']
const UI_SOURCES = [APP, UI]
// Token sources hold the literals every other file must reference.
const TOKEN_SOURCES = new Set([
    `${UI}/theme.css`,
    `${UI}/motion.css`,
    `${UI}/base.css`,
    `${UI}/accents.ts`,
])
// The only places that read the motion level or the OS motion setting directly.
const MOTION_LEVEL_SOURCES = new Set([
    `${UI}/theme.css`,
    `${UI}/motion.css`,
    `${UI}/base.css`,
    `${UI}/motion.ts`,
])
const APPEARANCE = `${APP}/core/appearance/`
// Fixed brand marks (Steam, Google, service logos) keep their literal colors.
const BRAND_FILE = /(?:^|\/)brand\//
// Owner composables: core/use*.ts and anything in a feature's composables/.
const QUERY_OWNER = new RegExp(
    `^${APP}/(?:core/use\\w+\\.ts|features/[^/]+/composables/.+)$`,
)
const LAYER_FLOOR = 30
const FOLDER_CAP = 12
const LETTER = /\p{L}/u
const STRING_LITERAL = /^\s*(['"`])[^'"`]*\p{L}[^'"`]*\1\s*$/u

/** A literal string with copy in it; `${...}` parts are dynamic and do not count. */
function isLiteralCopy(source: string): boolean {
    return STRING_LITERAL.test(source.replace(/\$\{[^}]*\}/g, ''))
}
const TEXT_ATTR =
    /^(?:label|placeholder|title|alt|text|description|aria-label)$|-(?:label|title|text|description)$/
const RAW_CONTROLS = new Set(['input', 'select', 'textarea', 'dialog'])
// A raw <button> is fine as a custom pressable surface; one dressed as a button (own fill
// plus padding) is a hand-rolled FpButton.
const BUTTON_FILL = /(?:^|\s)bg-(?!transparent\b)[\w/-]+/
const BUTTON_PADDING = /(?:^|\s)p[xy]?-\d/
const COLOR_PROPS =
    'color|background(?:-color)?|border(?:-[a-z]+)*|outline(?:-color)?|fill|stroke|(?:box|text)-shadow|(?:caret|accent)-color'
const NAMED_COLORS =
    /(?<![\w-])(?:white|black|red|green|blue|gr[ae]y|silver|orange|yellow|purple|pink|navy|teal)(?![\w-])/g
const LENGTH = /(?<![\w.-])(?!9{3,}px)\d*\.?\d+(?:px|r?em)\b/g

/** Repo-relative paths with `/` on every OS, so baseline keys stay portable. */
function sources(dirs: string[], exts = ['vue', 'css', 'ts']): string[] {
    return globSync(
        dirs.flatMap((dir) => exts.map((ext) => `${dir}/**/*.${ext}`)),
        { cwd: ROOT },
    )
        .map((file) => file.replaceAll('\\', '/'))
        .filter((file) => !/\.(stories|test)\.ts$/.test(file))
}

function read(file: string): string {
    return readFileSync(join(ROOT, file), 'utf8')
}

function lineAt(src: string, index: number): number {
    return src.slice(0, index).split('\n').length
}

function re(regex: RegExp): Find {
    return (src) =>
        [...src.matchAll(regex)].map((m) => ({
            index: m.index,
            text: m[0],
            capture: m[1] ?? '',
        }))
}

/** One match per `value` hit inside every CSS declaration whose property matches `property`. */
function decl(property: string, value: RegExp): Find {
    const declaration = new RegExp(
        `(?<![\\w-])(${property})\\s*:([^;{}]*)`,
        'g',
    )
    return (src) =>
        [...src.matchAll(declaration)].flatMap((d) => {
            const body = d[2] ?? ''
            const start = d.index + d[0].length - body.length
            return [...body.matchAll(value)].map((m) => ({
                index: start + m.index,
                text: `${d[1]}: ${m[0]}`,
                capture: m[1] ?? '',
            }))
        })
}

/** Text rule over every source file; `keep` filters a match by its capture. */
function pattern(
    dirs: string[],
    finders: Find[],
    {
        keep = (_: string) => true,
        exempt = (file: string) => TOKEN_SOURCES.has(file),
    } = {},
): () => Hit[] {
    return () =>
        sources(dirs)
            .filter((file) => !exempt(file))
            .flatMap((file) => {
                const src = read(file)
                return finders
                    .flatMap((find) => find(src))
                    .filter((m) => keep(m.capture))
                    .map((m) => ({
                        file,
                        line: lineAt(src, m.index),
                        text: m.text.trim(),
                    }))
            })
}

/** Visits every node of the `<template>` block in SFCs under `dirs`. */
function template(dirs: string[], visit: Visit): () => Hit[] {
    return () =>
        sources(dirs, ['vue']).flatMap((file) => {
            const hits: Hit[] = []
            const walk = (node: TemplateChildNode) => {
                for (const text of visit(node))
                    hits.push({ file, line: node.loc.start.line, text })
                if (node.type === NodeTypes.ELEMENT) node.children.forEach(walk)
            }
            const root = parse(read(file)).children.find(
                (n): n is ElementNode =>
                    n.type === NodeTypes.ELEMENT && n.tag === 'template',
            )
            root?.children.forEach(walk)
            return hits
        })
}

function element(check: (el: ElementNode) => string | null): Visit {
    return (node) => {
        const text = node.type === NodeTypes.ELEMENT ? check(node) : null
        return text === null ? [] : [text]
    }
}

/** Static copy: text nodes, literal interpolations and text attributes, plain or bound to a literal. */
function rawText(node: TemplateChildNode): string[] {
    if (node.type === NodeTypes.TEXT)
        return LETTER.test(node.content) ? [node.content.trim()] : []
    if (node.type === NodeTypes.INTERPOLATION) {
        return isLiteralCopy(node.content.loc.source)
            ? [`{{ ${node.content.loc.source} }}`]
            : []
    }
    if (node.type !== NodeTypes.ELEMENT) return []
    return node.props.flatMap((p) => {
        if (p.type === NodeTypes.ATTRIBUTE) {
            return TEXT_ATTR.test(p.name) && LETTER.test(p.value?.content ?? '')
                ? [`${p.name}="${p.value?.content}"`]
                : []
        }
        const name =
            p.arg?.type === NodeTypes.SIMPLE_EXPRESSION ? p.arg.content : ''
        const source = p.exp?.loc.source ?? ''
        return p.name === 'bind' &&
            TEXT_ATTR.test(name) &&
            isLiteralCopy(source)
            ? [`:${name}="${source}"`]
            : []
    })
}

/** Static and bound class text of an element. */
function classText(el: ElementNode): string {
    return el.props
        .map((p) => {
            if (p.type === NodeTypes.ATTRIBUTE)
                return p.name === 'class' ? (p.value?.content ?? '') : ''
            const bound =
                p.name === 'bind' &&
                p.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
                p.arg.content === 'class'
            return bound ? (p.exp?.loc.source ?? '') : ''
        })
        .join(' ')
}

/** The top-level text of `defineProps<{ ... }>`: nested object types and other fields drop out. */
function propsKeys(src: string): string {
    const call = src.indexOf('defineProps<')
    const start = call < 0 ? -1 : src.indexOf('{', call)
    if (start < 0) return ''
    let depth = 0
    let keys = ''
    for (const char of src.slice(start)) {
        if (char === '{') depth++
        else if (char === '}' && --depth === 0) break
        else if (depth === 1) keys += char
    }
    return keys
}

/** Components declaring a `title` prop; on any other a `title` falls through to an element as a native tooltip. */
function titlePropComponents(): Set<string> {
    return new Set(
        sources([APP, UI], ['vue'])
            .filter((file) =>
                /(?:^|[;,\n])\s*title\??:/.test(propsKeys(read(file))),
            )
            .map(
                (file) =>
                    (file.startsWith(UI) ? 'Fp' : '') +
                    posix.basename(file, '.vue'),
            ),
    )
}

/** An attribute set plainly or bound (`title`, `:title`). */
function hasAttr(el: ElementNode, name: string): boolean {
    return el.props.some((p) =>
        p.type === NodeTypes.ATTRIBUTE
            ? p.name === name
            : p.name === 'bind' &&
              p.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
              p.arg.content === name,
    )
}

/** Hidden until hover, with no way to reveal it on touch. */
function hoverOnlyReveal(el: ElementNode): string | null {
    const classes = classText(el)
    const hidden = /(?:^|[\s'"`:])opacity-0(?![\w-])/.test(classes)
    const hoverShown = /hover:opacity-100/.test(classes)
    return hidden && hoverShown && !/pointer-(?:coarse|fine):/.test(classes)
        ? 'opacity-0 until hover'
        : null
}

/** One hit per module of a folder holding more than FOLDER_CAP; tests are not counted. */
function crowdedFolders(): Hit[] {
    const folders = Map.groupBy(sources(UI_SOURCES, ['vue', 'ts']), (file) =>
        posix.dirname(file),
    )
    return [...folders]
        .filter(([, files]) => files.length > FOLDER_CAP)
        .flatMap(([dir, files]) =>
            files.map((file) => ({
                file: dir,
                line: 1,
                text: posix.basename(file),
            })),
        )
}

export const RULES: Rule[] = [
    {
        id: 'raw-control',
        why: 'Use the @so/ui primitive (FpButton, FpInput, FpSelect, FpModal) instead of a raw control.',
        scan: template(
            [APP, ...SHELLS],
            element((el) => {
                if (RAW_CONTROLS.has(el.tag)) return `<${el.tag}>`
                const classes = classText(el)
                return el.tag === 'button' &&
                    BUTTON_FILL.test(classes) &&
                    BUTTON_PADDING.test(classes)
                    ? '<button> styled as a button'
                    : null
            }),
        ),
    },
    {
        id: 'native-tooltip',
        why: 'Bind `tip(text)` from @so/ui on the trigger (`{ label: true }` also names an icon-only control) instead of a native title.',
        scan: () => {
            const titled = titlePropComponents()
            return template(
                [APP, UI, ...SHELLS],
                element((el) =>
                    hasAttr(el, 'title') &&
                    (el.tagType === ElementTypes.ELEMENT ||
                        (el.tagType === ElementTypes.COMPONENT &&
                            !titled.has(el.tag)))
                        ? `<${el.tag} title>`
                        : null,
                ),
            )()
        },
    },
    {
        id: 'raw-text',
        why: 'User-facing copy goes through t() so every language can translate it.',
        scan: template([APP, ...SHELLS], rawText),
    },
    {
        id: 'hover-only-reveal',
        why: 'Touch has no hover: content revealed on hover also needs a pointer-coarse: state.',
        scan: template([APP], element(hoverOnlyReveal)),
    },
    {
        id: 'layer-literal',
        why: `z-index ${LAYER_FLOOR}+ is a global layer: use a layer-* utility.`,
        scan: pattern(
            UI_SOURCES,
            [
                re(/\bz-(\d+)\b/g),
                re(/\bz-\[(\d+)\]/g),
                re(/z-?index\s*:\s*(\d+)/gi),
            ],
            {
                keep: (n) => Number(n) >= LAYER_FLOOR,
            },
        ),
    },
    {
        id: 'token-class',
        why: 'Use the named utilities (layer-*, safe-*, duration-*, delay-*, ease-*) instead of arbitrary token classes.',
        scan: pattern(UI_SOURCES, [
            re(/[\w:-]+-\(--(?:layer|safe|dur|ease)-[\w-]+\)/g),
            re(/[\w:-]+-\[[^\]\s]*var\(--(?:layer|safe|dur|ease)-[^\]\s]*\]/g),
        ]),
    },
    {
        id: 'motion-literal',
        why: 'Use --dur-* / --ease-* tokens from theme.css or motion.css instead of literal timing or easing.',
        scan: pattern(UI_SOURCES, [
            re(/\b(?:duration|delay)-(?:[1-9]\d*|\[(?!var\()[^\]]+\])/g),
            re(/\bease-\[(?!var\()[^\]]+\]/g),
            re(/cubic-bezier\(/g),
            re(/\beasing:\s*['"`](?!var\()/g),
            decl(
                'transition[\\w-]*|animation[\\w-]*',
                /(?<![\w.-])(?:\d*\.)?\d*[1-9]\d*m?s\b|(?<![\w-])ease(?:-in-out|-in|-out)?(?![\w-])/g,
            ),
        ]),
    },
    {
        id: 'motion-level-source',
        why: 'Read the motion level through the kit: the motion-off:/motion-simple:/motion-on: variants or motionLevel().',
        scan: pattern(
            UI_SOURCES,
            [re(/prefers-reduced-motion|data-motion\b|dataset\.motion\b/g)],
            {
                exempt: (file) =>
                    MOTION_LEVEL_SOURCES.has(file) ||
                    file.startsWith(APPEARANCE),
            },
        ),
    },
    {
        id: 'color-literal',
        why: 'Use color tokens; literal colors break accent, mode and surface switching.',
        scan: pattern(
            [...UI_SOURCES, ...SHELLS],
            [
                re(/#[0-9a-fA-F]{3,8}\b(?![=>\w-])/g),
                re(/\b(?:rgba?|hsla?)\(/g),
                re(/\boklch\(\s*[\d.]/g),
                re(
                    /\b(?:bg|text|border|ring|fill|stroke|outline|from|via|to|shadow)-(?:black|white)\b/g,
                ),
                decl(COLOR_PROPS, NAMED_COLORS),
            ],
            {
                exempt: (file) =>
                    TOKEN_SOURCES.has(file) || BRAND_FILE.test(file),
            },
        ),
    },
    {
        id: 'radius-off-scale',
        why: 'Bare `rounded` is the default; scale steps and literal radii are reserved for the kit.',
        scan: pattern(
            [APP],
            [
                re(
                    /\brounded(?:-[a-z]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|\[[^\]]+\])/g,
                ),
                decl('border(?:-[a-z]+)*-radius', LENGTH),
            ],
        ),
    },
    {
        id: 'text-off-scale',
        why: 'Use the text-* scale; arbitrary font sizes drift from the type ramp.',
        scan: pattern(UI_SOURCES, [
            re(/\btext-\[(?:\d|calc|clamp)[^\]]*\]/g),
            decl('font-size', LENGTH),
        ]),
    },
    {
        id: 'crowded-folder',
        why: `A folder holds at most ${FOLDER_CAP} modules: group the rest into subfolders by concern.`,
        scan: crowdedFolders,
    },
    {
        id: 'route-query-owner',
        why: 'A query key has one owner: a composable in core/ (useQueryOverlay) or a feature composables/ folder. Components never read or write route.query.',
        scan: pattern([APP], [re(/\b(?:route|useRoute\(\))\.query\b/g)], {
            exempt: (file) => QUERY_OWNER.test(file),
        }),
    },
]
