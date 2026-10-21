# accounts

The vault's account list: search, ban filters, sort, pinned and all groups as a virtual grid of cards, the Card fields panel, and the Add account overlay.

- `index.ts` exports `accountsRoutes`, the model types, `useVaultAccounts` (the vault's accounts with session pins, the one source other screens read) and the card parts other screens reuse: `AccountCard`, `LevelAvatar` (level ring), `AgeChip`, `BanLetters`.
- `model.ts` holds `Account`, the one shape the list, the card and (wave 3) the profile read.
- The list is virtual by rows (`useAccountRows`, TanStack Virtual against `useScrollRoot()`): columns follow the measured width (`auto-fill`, 340px minimum), row heights come from `services/cardLayout.ts`, which mirrors the card's CSS and also feeds the "Card height" readout. A card is never measured.
- Search field, ban filters (any, require, exclude), sort and the Card fields flags persist through `core/storage` (`stores/accountsView.ts`, `stores/cardFields.ts`). Pins last the session.
- Add account is `?add-account` (`useQueryOverlay`): a modal on desktop, a sheet on phones. `services/steamId.ts` detects the eight identifier formats.
- Steam Guard code, countdown and hold-to-reveal come from `features/steam-guard`.

## Mocks

Mockup: `Accounts.dc.html` (Desktop, Mobile, Mobile · Card fields), `AccountCard.dc.html`, `Onboarding.dc.html` (Add account · Desktop, Add account · Mobile).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `accounts.list` (Twelve, Empty, No results, One locked, Anonymous only, 2000 accounts) | grid, groups, card, search, filters, sort, empty states, duplicate check in Add | the vault | `useVaultAccounts` |
| `accounts.refresh` (Eight left, Idle) | refresh pill (desktop), ring (phone) | bulk Steam refresh | `useAccountsList` |
| `accounts.lookup` (Nova Strike, VAC banned) | Add account profile result after a 900ms simulated lookup | Steam Web API | `useAddAccountForm` |

`No results` opens on a search no account matches; the query stays in the persisted view until Reset filters.

Unwired intents (buttons emit them, nothing listens yet): reorder mode, refresh all, import / export, delete account, edit tags, open profile (`/accounts/:id` has no route until wave 3), saving on Add (it only closes the overlay), maFile parsing (the name is shown, no `shared_secret` is read), a loading state for the list.
