// The UI kit and the framework packages: pulling any of them in makes a module Vue-bound.
const FRAMEWORK_MODULES = [
    '(^|/)node_modules/(vue|vue-router|pinia|vue-i18n|reka-ui|@vue|@pinia|@vueuse)(/|$)',
    '^packages/ui/',
    '\\.vue$',
]

const APP = 'packages/app/src'

/** One feature slice, matched once so every boundary covers it the same way. */
const FEATURE = `${APP}/features/[^/]+`

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: 'feature-only-via-facade',
            comment:
                'Outside a feature, import only its facade (#features/<name> = index.ts)',
            severity: 'error',
            from: { pathNot: `^${APP}/features/` },
            to: {
                path: `^${FEATURE}/.`,
                pathNot: `^${FEATURE}/index\\.ts$`,
            },
        },
        {
            name: 'no-cross-feature-deep-imports',
            comment: 'Feature → other feature goes facade-to-facade',
            severity: 'error',
            from: { path: `^${APP}/features/([^/]+)/` },
            to: {
                path: `^${FEATURE}/.`,
                pathNot: [`^${APP}/features/$1/`, `^${FEATURE}/index\\.ts$`],
            },
        },
        {
            name: 'mocks-only-in-view-models',
            comment:
                "A feature's mocks.ts reaches a view only through its view-models (composables/ or stores/), so wiring a source touches one composable",
            severity: 'error',
            from: { pathNot: `^${FEATURE}/(composables|stores)/` },
            to: { path: `^${FEATURE}/mocks\\.ts$` },
        },
        {
            name: 'services-framework-free',
            comment:
                'features/*/services is plain TS: no vue/pinia/router/kit, no core index (it pulls Vue in) - testable without DOM. Import a Vue-free core file by path',
            severity: 'error',
            from: { path: `^${FEATURE}/services/` },
            to: { path: [...FRAMEWORK_MODULES, `^${APP}/core/index\\.ts$`] },
        },
        {
            name: 'core-only-via-index',
            comment:
                'Outside core, import #core (index.ts). Framework-free services take a Vue-free core module by path, since the index pulls Vue in',
            severity: 'error',
            from: {
                path: `^${APP}/`,
                pathNot: [`^${APP}/core/`, `^${FEATURE}/services/`],
            },
            to: {
                path: `^${APP}/core/.`,
                pathNot: `^${APP}/core/index\\.ts$`,
            },
        },
        {
            name: 'core-independent',
            comment:
                'app/core is shared infra - it never depends on features or app-wide components',
            severity: 'error',
            from: { path: `^${APP}/core/` },
            to: { path: `^${APP}/(features|components)/` },
        },
        {
            name: 'ui-package-app-independent',
            comment:
                'packages/ui is the kit: it never depends on the app or a shell',
            severity: 'error',
            from: { path: '^packages/ui/' },
            to: { path: '^(packages/app|apps)/' },
        },
        {
            name: 'app-not-into-shells',
            comment:
                'Shells call mountApp; the app never imports a shell and branches on usePlatform()',
            severity: 'error',
            from: { path: '^packages/app/' },
            to: { path: '^apps/' },
        },
        {
            name: 'no-circular',
            severity: 'error',
            from: {},
            to: { circular: true },
        },
    ],
    options: {
        // Tests may mock framework modules outside the production graph.
        exclude: { path: '\\.test\\.ts$' },
        doNotFollow: { path: 'node_modules' },
        tsPreCompilationDeps: true,
        // The schema has no importsFields; enhanced-resolve reads package.json "imports"
        // (#core, #features/*, #components/*) by default.
        enhancedResolveOptions: {
            exportsFields: ['exports'],
            conditionNames: ['import', 'default'],
            extensions: ['.ts', '.mjs', '.js', '.vue', '.json'],
        },
    },
}
