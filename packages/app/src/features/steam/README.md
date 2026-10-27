# steam

The app's access to the Steam Web API: the vault's key, the client and what a failure tells the user. The requests themselves live in `@so/core` (`steam/`: `steamApi`, `fetchProfiles`, `resolveSteamId`, `checkKey`, the Steam ID formats).

- `useSteamKey()`: the key in the `settings` record's secret (synced with the vault, never in device storage), read again whenever the record changes; `save` reseals that secret, an empty key removes it.
- `useSteamApi()`: `reachable` is false on web (`Platform.fetch === null`), where nothing may call it; `api()` reads the key per call, so one saved meanwhile applies. A call without a key fails as `no-key` before any request.
- `useSteamProblem()`: a `SteamError` as title, description, icon and its fix: Settings for `no-key` and `bad-key`, Retry for `offline`, `rate-limit` and `server`. Any other error is reported and shown as `server`.
