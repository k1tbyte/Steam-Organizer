# accounts

The vault's account list: search, ban filters, sort, pinned and all groups as a virtual grid of cards, reorder mode, the Card fields panel, and the Add account overlay.

- `index.ts` exports `accountsRoutes`, the model types, `useVaultAccounts` (the vault's accounts with session pins and order, the one source other screens read), `useAccountPassword` (the Steam password a copy or a fill takes) and the card parts other screens reuse: `AccountCard`, `LevelAvatar` (level ring, sizes up to the profile's `xl`), `AgeChip`, `AccountTagChip`, `BanLetters`, and `BAN_KINDS`.
- `model.ts` holds `Account`, the one shape the list, the card and the profile read.
- The list is virtual by rows (`useAccountRows`, TanStack Virtual against `useScrollRoot()`): columns follow the measured width (`auto-fill`, 340px minimum), row heights come from `services/cardLayout.ts`, which mirrors the card's CSS and also feeds the "Card height" readout. A card is never measured. Rows key by slot (`services/listSlots.ts`) and cards by column, so a row that scrolls in reuses the nodes of one that left; card state tied to one account (a copy mark, a held Guard code) resets when the account changes.
- The list has one context menu (`FpContextMenu` in `AccountsGrid`, `useAccountMenu`): a right-click on a card, or the touch card's More button, opens it for the card's `data-account-id`. It keeps the id, not the node (a recycled node shows another account), closes when that account leaves the vault, the list scrolls or its card node goes to another account (a resize), and hands focus back only to a control still in that account's card. Copies toast; locked accounts copy nothing. Edit tags and Delete are the grid's intents, unwired upstream like the card buttons.
- Search field, ban filters (any, require, exclude), sort and the Card fields flags persist through `core/storage` (`stores/accountsView.ts`, `stores/cardFields.ts`). Pins and the order last the session.
- Reorder mode is `?reorder` (`composables/reorder/`): the list shows what the search and ban filters let through in the vault order (the sort waits, the stored one untouched) in `AccountsReorderGrid`; a filtered group moves its shown cards among their own places. `ReorderBar` keeps the ban chips and swaps the sort and tools for the status, Clear and Done (outside the chips' scroll on phones). The grid places cards at `translate` offsets and keeps a card's node while it is on screen, so a move slides it; a card that comes in takes the node of one that left, like `AccountsGrid`. A cover over each card takes its presses: a mouse drags a card from anywhere, touch from the grip that replaces its pin (`AccountCard` `hidePin`); arrows move the focused card. Cards go `inert` only while the keyboard is in the grid: inert content (or `pointer-events: none`) costs Chrome a compositor layer per card part. The slot follows the pointer: neighbours make room once it rests over a card, never while the list scrolls, and off the group's cards the card goes back to its place. A move commits to the order once it has landed: committing reorders the DOM, which would cut its transition. Cards move within their group only. A click, tap or Space picks a card, Shift the range from the last one, all in one group (`useReorderSelection`, module state the bar and the grid share; Esc clears it before leaving the mode). Dragging a picked card carries the selection as a stack that takes one slot: picked cards on screen fly into it, and on the drop they fan out together at its slot in their order.
- Add account is `?add-account` (`useQueryOverlay`): a modal on desktop, a sheet on phones. `detectSteamId` (`core/steamId.ts`, shared with the profile's ID formats) recognizes the eight identifier formats.
- The card's title links to `/accounts/:id` (`features/profile`). The card whose id is `useRouteHero()` carries `data-vt-hero`, the shared element of the card to profile morph (`features/shell`).
- Steam Guard code, countdown and hold-to-reveal come from `features/steam-guard`.

## Mocks

Mockup: `Accounts.dc.html` (Desktop, Mobile, Mobile · Card fields), `AccountCard.dc.html`, `Onboarding.dc.html` (Add account · Desktop, Add account · Mobile).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `accounts.list` (2000 accounts: the twelve plus generated ones; Twelve, Empty, No results, One locked, Anonymous only) | grid, groups, card, search, filters, sort, empty states, duplicate check in Add | the vault | `useVaultAccounts` |
| `accounts.refresh` (Eight left, Idle) | refresh pill (desktop), ring (phone) | bulk Steam refresh | `useAccountsList` |
| `accounts.lookup` (Nova Strike, VAC banned) | Add account profile result after a 900ms simulated lookup | Steam Web API | `useAddAccountForm` |
| `DEMO_STEAM_PASSWORD` (no variants) | Copy password (card menu, popup) and the password a fill types | the decrypted account | `useAccountPassword` |

`No results` opens on a search no account matches; the query stays in the persisted view until Reset filters.

Unwired intents (buttons emit them, nothing listens yet): refresh all, import / export, delete account, edit tags, saving on Add (it only closes the overlay), maFile parsing (the name is shown, no `shared_secret` is read), a loading state for the list.
