# profile

One account's page at `/accounts/:id` (`meta: { nav: 'accounts', hero: true }`; an id the vault does not hold goes back to `/`): identity header, tabs (Summary, Games, Friends, Steam Guard), the account's own lock, and the Lock account dialog.

- `index.ts` exports `profileRoutes`; `router.ts` nests it under the shell.
- `useProfile` reads the account from `useVaultAccounts()` and its Steam-side data from the mock. `ProfileView` builds the page-owned view-models; sections call their own (`useCredentials`, `useCommunity`, `useProfileNote`).
- Desktop and phone mount different heroes (`ProfileHero`, `ProfileHeroPhone`), never both. The desktop hero carries `data-vt-hero`: the shared element of the card to profile morph, run by the shell (`features/shell`, `meta.hero`).
- The Steam ID shows in the format every profile shares (`steamIdValues` in `core/steamId.ts`); the format and the folded sections persist through `core/storage` (`stores/profilePrefs.ts`). The note (200 characters) shows as typed (`stores/profileNotes.ts`) and reaches the vault after a 600ms pause or when the page goes (`useProfileNote`).
- A locked account asks its own password even with the vault open (`useAccountGate`): credentials only, or everything but the nickname and avatar. "Forgot password?" takes the master password when recovery is on and says so when it is off. The unlocked state lives in the page, so leaving the account or locking the vault locks it again. The demo password and master password are both `demo`.
- Steam links open the real Steam and SteamDB pages for the SteamID64 (`services/steamLinks.ts`).
- Steam Guard comes from `features/steam-guard`: the header control, and the tab's code (hold to show, copy while hidden), revocation code and remove-authenticator intent.
- Lock account is `?lock-account` (`useQueryOverlay`): a modal on desktop, a sheet on phones.

## Mocks

Mockup: `Profile.dc.html` (Desktop, Mobile, Locked account, Mobile · Locked, Lock account · Dialog), `Motion.dc.html` (Card to profile).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `profile.details` (Sample accounts, Credentials locked, recovery on, Everything locked, no recovery, No linked services, Active bans, No Steam Guard, Private profile) | visibility, registration, vanity, friend code, stats and Community tiles, ban details, linked services and their fields, the account's lock, revocation code | Steam Web API for the profile data; the vault for services, lock and authenticator | `useProfile` |

`Sample accounts` derives a profile from any account; a1, a12 and a8 carry the mockup's own. Every other variant edits whichever account is open.

Unwired intents (buttons emit them, nothing listens yet): Refresh, edit credentials, delete account, change or remove the account password, confirming Lock account (the dialog only closes), add / edit / remove a linked service, edit tags, Import maFile, remove authenticator. Games and Friends are empty states until Steam data arrives.
