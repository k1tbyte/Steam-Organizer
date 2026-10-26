# linked-services

The registry of services an account keeps logins for: a built-in gaming set (`BUILT_IN_SERVICES`, fixed ids stored in account secrets) and the user's own as SERVICE vault records (name, optional SVG icon). A service's name and icon live only here; an account's secret holds `{ service, fields }`, one entry per service.

- `useVaultServices()`: built-in plus own services, `of(id)` (an unknown or deleted id reads as Other with a globe), and the one writer of SERVICE records: `create` (returns the id already holding the name, built-in names included, ignoring case), `update` (name, `icon: null` drops it), `remove` (tombstone, resolving to an undo; accounts keep their credentials).
- `ServiceIcon`: a built-in's iconify glyph, or an uploaded SVG as a CSS mask painted with the text color, so it follows the theme and nothing in it runs. `readSvg` takes up to 16 KB of `<svg>` markup.

## Mocks

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `linked-services.own` (Two added, None) | the user's own services in the profile and Settings | the vault's SERVICE records | `useVaultServices` |

Settings → Linked services (`features/settings`) edits the user's own services.
