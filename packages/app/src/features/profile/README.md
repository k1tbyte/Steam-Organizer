# profile

One account's page at `/accounts/:id` (`meta: { nav: 'accounts', hero: true }`; an id the vault does not hold goes back to `/`): identity header, tabs (Summary, Games, Friends, Steam Guard), the account's own lock, and the Lock account dialog.

- `index.ts` exports `profileRoutes`; `router.ts` nests it under the shell.
- `useProfile` reads the account from `useVaultAccounts()` and its Steam-side data from the mock. For an account the vault holds, Credentials and the revocation code come from its secret (`useVaultCredentials` over `useAccountSecret`), and a login or note the vault keeps secret joins the page's account; they stay empty while it opens. `ProfileView` builds the page-owned view-models; sections call their own (`useCredentials`, `useCommunity`, `useProfileNote`).
- Credentials edits go through `useEditSecret` from accounts (`useSecretWrite` reports a failure): Edit on Steam opens the Steam password dialog (Save replaces the vault's copy, no history; Generate from `services/generatePassword`), on a linked service its editor; + adds one (up to `MAX_ACCOUNT_SERVICES`, the disabled button's wrapper explains), Remove asks in a popover. Over a sample nothing is written.
- Desktop and phone mount different heroes (`ProfileHero`, `ProfileHeroPhone`, view-models in `composables/hero/`), never both. Both show the name through `AliasTitle`: the pencil or F2 renames in place (`useAliasEditor`: Enter or leaving the field saves, Esc cancels, an empty name brings the Steam nickname back; an anonymous account keeps its name), the Steam nickname sits under an alias, "Add alias" under a Steam nickname. The desktop hero carries `data-vt-hero`: the shared element of the card to profile morph, run by the shell (`features/shell`, `meta.hero`).
- The Steam ID shows in the format every profile shares (`steamIdValues` in `core/steamId.ts`); the format and the folded sections persist through `core/storage` (`stores/profilePrefs.ts`). The note (200 characters) shows as typed (`stores/profileNotes.ts`) and reaches the vault after an 800ms pause, on leaving the field, when the page goes or before the vault locks (`useProfileNote`); the header says Saving…, then Saved for 2 s, or Not saved with Retry.
- A locked account asks its own password even with the vault open (`useAccountGate`): credentials only, or everything but the nickname and avatar. "Forgot password?" takes the master password when recovery is on and says so when it is off. The unlocked state lives in the page, so leaving the account or locking the vault locks it again. The demo password and master password are both `demo`.
- Steam links open the real Steam and SteamDB pages for the SteamID64 (`services/steamLinks.ts`).
- Steam Guard comes from `features/steam-guard`: the header control, and the tab's code (hold to show, copy while hidden) and revocation code. `useAuthenticator` imports a maFile from the header (a refused file replaces the Import row until another is picked) and removes the authenticator after the revocation code is confirmed saved. An anonymous account keeps Steam Guard.
- Lock account is `?lock-account` (`useQueryOverlay`): a modal on desktop, a sheet on phones.

## Mocks

Mockup: `Profile.dc.html` (Desktop, Mobile, Locked account, Mobile · Locked, Lock account · Dialog), `Motion.dc.html` (Card to profile), `Primitives 3b.dc.html` (3b-1: alias in the hero; the note's save states are in its header text).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `profile.details` (Sample accounts, Credentials locked, recovery on, Everything locked, no recovery, No linked services, Active bans, No Steam Guard, Private profile) | visibility, registration, vanity, friend code, stats and Community tiles, ban details, linked services and their fields, the account's lock, revocation code | Steam Web API for the profile data; the vault for the lock (a vault account's services and revocation code already come from its secret) | `useProfile` |

`Sample accounts` derives a profile from any account; a1, a12 and a8 carry the mockup's own. Every other variant edits whichever account is open.

Delete account asks first (`RemoveAccountsDialog` from `features/accounts`); the page then goes back to the list. The hero's tag button opens `AccountTagPicker` from `features/accounts`.

Unwired intents (buttons emit them, nothing listens yet): Refresh, change or remove the account password, confirming Lock account (the dialog only closes). Games and Friends are empty states until Steam data arrives.
