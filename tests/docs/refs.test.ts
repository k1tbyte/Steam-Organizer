import { execFileSync } from 'node:child_process'
import { existsSync, globSync, readFileSync } from 'node:fs'
import { matchesGlob } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const FILE_REF = /\.(?:ts|vue|css|md|cjs|mjs|json)$|\/$/
const REPO_DIR = /^(?:apps|packages|tests|\.claude)\//
// Not a repo path: a package, URL or route, placeholder or glob.
const NOT_A_PATH = /^[@#/]|^https?:|[<>*{}()=|]|\.\.\./

// Paths the docs name before any file exists. Delete an entry once it lands.
const PLANNED = new Set([
    // Feature subfolders: no feature slice exists yet, so none of these do either.
    'services',
    'stores',
    'components/list',
    'components/card',
    // Local-only and gitignored, so `git ls-files` never lists it.
    'artifacts',
    'mockup',
    'legacy',
    'shots',
    'orch',
])

// Untracked files count: a doc and the file it names land together, before `git add`.
// The index still lists a file deleted from the worktree, hence the existence check.
const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 },
)
    .split('\n')
    .filter((file) => file !== '' && existsSync(`${ROOT}${file}`))

// Docs shorten paths to their slice or package (`composables/useCreateChannel.ts`,
// `components/list/`), so a reference holds when any tracked path contains it.
const known = new Set<string>()
for (const file of files) {
    const parts = file.split('/')
    for (let from = 0; from < parts.length; from++)
        for (let to = from + 1; to <= parts.length; to++)
            known.add(parts.slice(from, to).join('/'))
}

const DOCS = [
    'CLAUDE.md',
    ...globSync(
        [
            '.claude/rules/*.md',
            '.claude/skills/*/SKILL.md',
            'packages/app/src/**/README.md',
        ],
        { cwd: ROOT },
    ).map((file) => file.replaceAll('\\', '/')),
]
const RULES = DOCS.filter((doc) => doc.startsWith('.claude/rules/'))

const read = (file: string) => readFileSync(`${ROOT}${file}`, 'utf8')

/** Backticked repo paths: a file with a known extension, a folder with a trailing slash, or
 *  a folder named from the repo root. */
function refs(src: string): string[] {
    return [...src.matchAll(/`([^`\s]+)`/g)]
        .map((match) =>
            (match[1] ?? '').replace(/^~\//, '').replace(/[,.:;]+$/, ''),
        )
        .filter(
            (token) =>
                !NOT_A_PATH.test(token) &&
                (token.includes('/') || token.endsWith('.md')) &&
                (FILE_REF.test(token) || REPO_DIR.test(token)),
        )
        .map((token) => token.replace(/\/$/, ''))
}

/** The globs of a rule's `paths:` front matter. */
function pathGlobs(src: string): string[] {
    const front = /^---\n([\s\S]*?)\n---/.exec(
        src.replaceAll('\r\n', '\n'),
    )?.[1]
    return [...(front ?? '').matchAll(/^\s+-\s+'([^']+)'/gm)].map(
        (m) => m[1] ?? '',
    )
}

describe('agent docs', () => {
    test.each(DOCS)('%s names files that exist', (doc) => {
        expect(
            refs(read(doc)).filter(
                (ref) => !known.has(ref) && !PLANNED.has(ref),
            ),
        ).toEqual([])
    })

    test.each(RULES)('%s loads on files that exist', (rule) => {
        const globs = pathGlobs(read(rule))
        expect(globs, 'a rule with no paths is never loaded').not.toEqual([])
        expect(
            globs.filter(
                (glob) => !files.some((file) => matchesGlob(file, glob)),
            ),
        ).toEqual([])
    })
})
