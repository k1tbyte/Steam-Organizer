# Mock data

Design-first scaffolding: a screen is built from its mockup with every block fed by a view-model, and a view-model without a real source reads a mock. Wiring a block swaps one composable body.

- `defineMock(key, label, variants)` in a feature's `mocks.ts`: named samples (`'Twelve accounts'`, `'Empty'`), the first is the default pick, usually the mockup's own data.
- `useMock(real, mock)` in the feature's view-model: `real` returns `undefined` while there is no source; a wired read maps "nothing" to `null`.
- Modes, picked in `MockPanel` (bottom-right, dev builds only) with a variant per mock. The panel lists only mocks read by mounted view-models.

| Mode | Shows |
|---|---|
| `live` | real data only; a block without a source hides |
| `fill` (default) | real data, mocks where `real` is `undefined` |
| `mock` | the picked variant everywhere, to check a screen against its mockup |

`pnpm arch` (`mocks-only-in-view-models`) keeps `mocks.ts` out of components.

## Wiring a block

Replace `useMock(() => undefined, xMock)` with the real read, delete the mock from `mocks.ts`, and update the feature README's Mocks table.

## Removing the layer

Delete `core/mock/`, `components/MockPanel.vue` (and its tag in `App.vue`), every `features/*/mocks.ts`, the `startMocks` call in `index.ts`, `MOCKS_STORAGE_KEY` and the arch rule. Typecheck then lists each remaining `useMock` call.
