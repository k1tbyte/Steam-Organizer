# steam-guard

The Steam Guard control other screens place: a code masked until held, a 30s countdown ring and a copy button. The account card uses it; the profile and the extension popup build on it.

- `SteamGuardCode` takes the account `seed` and a `size` (`sm` card, `md` phone card). Hold the code (pointer, Space or Enter) to show it; the copy button copies the current code even while masked.
- `useGuardCode` also returns `currentCode()`, the code of this instant, for callers that fill it (the autofill prompt) instead of showing it.
- `useGuardClock` is one 1s clock for every mounted code, so a list of cards runs one interval; it stops with the last reader.
- `services/guardCode.ts` holds the 30s window math and the demo code.

## Mocks

Mockup: `AccountCard.dc.html`, `Accounts.dc.html` (the footer control).

| Mock | UI built | Source | Wire in |
|---|---|---|---|
| demo codes (`demoGuardCode`, no `mocks.ts`) | the five-character code per account and period | the authenticator's shared secret (Steam TOTP) | `useGuardCode` |

The demo code is a hash of account id and period, not Steam TOTP. Wiring swaps the `current` function in `useGuardCode`.
