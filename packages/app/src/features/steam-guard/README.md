# steam-guard

The Steam Guard control other screens place: a code masked until held, a 30s countdown ring and a copy button. The account card uses it; the profile and the extension popup build on it.

- `SteamGuardCode` takes the account `seed` and a `size` (`sm` card, `md` phone card). Hold the code (pointer, Space or Enter) to show it; the copy button copies the current code even while masked.
- `useGuardCode` also returns `currentCode()`, a promise of this instant's code, for callers that fill it (the autofill prompt) instead of showing it. `useGuardCodes()` gives the same code without a mounted control (the card menu's copy).
- A code comes from the authenticator the vault keeps for the account (`secretOf`): opened per call, only while held or copied, never cached. An id the vault does not hold is a sample and gets the demo code.
- `useGuardClock` is one 1s clock for every mounted code, so a list of cards runs one interval; it stops with the last reader.
- `services/guardCode.ts` holds the 30s window math, Steam's TOTP and the demo code.
- Codes and the clock run on Steam's time (`services/steamClock.ts`: `steamNow`, synced by `useGuardCodes` at most hourly through `steamClockOffset` from `@so/core`; a code of this instant waits for a read in flight, 3 s at most). Web and the autofill content script cannot reach `QueryTime` and stay on the device clock.
- `readMaFile` reads an SDA maFile (null without `shared_secret`; the SteamID64 is taken from the text, past JSON's number precision); `useMaFile(login)` holds a picked file and its problem (`broken`, or `another` when `account_name` differs from the login). The Add form and the profile import through it.

## Mocks

Mockup: `AccountCard.dc.html`, `Accounts.dc.html` (the footer control).

| Mock | UI built | Source | Wire in |
|---|---|---|---|
| demo codes (`demoGuardCode`, no `mocks.ts`) | the code of a sample account | none: a vault account's comes from its authenticator | stays for samples |

The demo code is a hash of account id and period, not Steam TOTP.
