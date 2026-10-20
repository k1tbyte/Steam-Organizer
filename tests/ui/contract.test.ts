import { describe, expect, test } from 'vitest'

import baseline from './baseline.json'
import { type Hit, RULES } from './rules'

// Known debt per rule and file. Counts only go down: lower them as violations are fixed.
const BASELINE: Record<string, Record<string, number>> = baseline

function format(hits: Hit[]): string {
    return hits
        .map(
            (hit) =>
                `  ${hit.file}:${hit.line}  ${hit.text.replace(/\s+/g, ' ')}`,
        )
        .join('\n')
}

describe('ui contract', () => {
    test.each(RULES)('$id', (rule) => {
        const found = Map.groupBy(rule.scan(), (hit) => hit.file)
        const allowed = BASELINE[rule.id] ?? {}
        const added = [...found]
            .filter(([file, hits]) => hits.length > (allowed[file] ?? 0))
            .map(
                ([file, hits]) =>
                    `${file}: ${hits.length} > ${allowed[file] ?? 0}\n${format(hits)}`,
            )
        const fixed = Object.entries(allowed)
            .filter(([file, max]) => (found.get(file)?.length ?? 0) < max)
            .map(
                ([file, max]) =>
                    `${file}: lower baseline ${max} -> ${found.get(file)?.length ?? 0}`,
            )
        expect([...added, ...fixed], rule.why).toEqual([])
    })
})
