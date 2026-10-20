// node shot.mjs mock <File.dc.html> "<frame label>" <out.png> [--mode=light] [--surface=glass] ...
// node shot.mjs page <url> <out.png> [--width=1280] [--height=860]
// Mock props (mode, accent, tinted, surface, background, radius, density) go in as --name=value.
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { chromium } from 'playwright'

const MOCKUPS = join(import.meta.dirname, '../../../artifacts/mockup')
const TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.svg': 'image/svg+xml',
}
const flags = Object.fromEntries(
    process.argv
        .slice(2)
        .filter((a) => a.startsWith('--'))
        .map((a) => a.slice(2).split('=')),
)
const [mode, target, ...rest] = process.argv
    .slice(2)
    .filter((a) => !a.startsWith('--'))
const browser = await chromium.launch()

if (mode === 'mock') {
    const [label, out] = rest
    // Nested .dc.html components load through fetch, which file:// blocks.
    const server = createServer(async (req, res) => {
        const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
        try {
            const body = await readFile(join(MOCKUPS, path))
            res.writeHead(200, {
                'content-type':
                    TYPES[extname(path)] ?? 'application/octet-stream',
            })
            res.end(body)
        } catch {
            res.writeHead(404).end()
        }
    }).listen(0)
    const page = await browser.newPage({
        viewport: { width: 2600, height: 1200 },
    })
    await page.goto(`http://localhost:${server.address().port}/${target}`, {
        waitUntil: 'networkidle',
    })
    const props = { ...flags }
    if (Object.keys(props).length)
        await page.evaluate((p) => {
            for (const k in p)
                if (p[k] !== '' && !Number.isNaN(Number(p[k])))
                    p[k] = Number(p[k])
            for (const k in p)
                if (p[k] === 'true' || p[k] === 'false') p[k] = p[k] === 'true'
            window.__dcSetProps(window.__dcRootName(), p)
        }, props)
    await page.waitForTimeout(1500)
    const frame = page.locator(`[data-screen-label="${label}"]`).first()
    const box = await frame.boundingBox()
    await frame.screenshot({ path: out })
    console.log(`${out} ${Math.round(box.width)}x${Math.round(box.height)}`)
    server.close()
} else {
    const [out] = rest
    const width = Number(flags.width ?? 1280)
    const height = Number(flags.height ?? 860)
    const page = await browser.newPage({ viewport: { width, height } })
    await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: out })
    console.log(`${out} ${width}x${height}`)
}
await browser.close()
