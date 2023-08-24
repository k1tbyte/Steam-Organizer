using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;
using System.Text;
using System.Text.Json;

namespace SteamOrganizer.Backend.Parsers.SteamAPI;

internal enum ESteamApiResult : byte
{
    OK,
    NoValidAccounts,
    NoAccountsWithID,
    AttemptsExceeded,
    OperationCanceled,
    InternalError,
}

internal static class SteamParser
{
    private static readonly string? ApiKey = App.Config.GetValue<string?>("Credentials:SteamApiKey");

    private static readonly ushort[] GamesBadgeBoundaries = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
             };



    /// <param name="accounts">list of accounts to update</param>
    /// <param name="processingCallback">Args: Current account, Remaining accounts count, Completed successfully </param>
    internal static async Task<ESteamApiResult> ParseInfo(ulong[] players,bool includeGames,string countryCode, Action<SteamSummariesObject.SteamSummariesResponse> callback)
    {
        try
        {
            // A chunk consists of a maximum of 100 accounts because
            // the maximum number of IDs that GetPlayerSummaries and GetPlayerBans accepts
            for (int i = 0, attempt = 0, remainingCount = players.Length; i < players.Length; i += 100)
            {
                var chunk = players
                    .Skip(i)
                    .Take(100)
                    .ToArray();

                var summariesTask = GetPlayersSummaries(chunk).ConfigureAwait(false);
                var bansTask      = GetPlayersBans(chunk).ConfigureAwait(false);

                var summaries = await summariesTask;
                var bans = (await bansTask)?.ToDictionary(o => o.SteamID);

                if (summaries == null || bans == null)
                {
                    if (++attempt >= WebBrowser.MaxAttempts)
                    {
                        return ESteamApiResult.AttemptsExceeded;
                    }

                    await Task.Delay(WebBrowser.RetryRequestDelay);
                    i -= 100;
                    continue;
                }

                await Parallel.ForEachAsync(summaries, new ParallelOptions { MaxDegreeOfParallelism = WebBrowser.MaxDegreeOfParallelism },
                    async (player, token) =>
                {
                    player.Bans       = bans[player.SteamID];

                    if (player.CommunityVisibilityState == 3)
                    {
                        player.SteamLevel     = await GetPlayerLevel(player.SteamID).ConfigureAwait(false); 
                        
                        if(includeGames)
                        {
                            player.GamesSummaries = await ParseGames(player.SteamID, countryCode).ConfigureAwait(false);
                        }
                    }

                    callback?.Invoke(player);
                }).ConfigureAwait(false);

            }
        }
        catch
        {
            return ESteamApiResult.InternalError;
        }

        return ESteamApiResult.OK;
    }

    internal static async Task<SteamSummariesObject.SteamSummariesResponse?> ParseInfo(ulong player, bool includeGames, string countryCode)
    {
        var summariesTask = GetPlayersSummaries(player).ConfigureAwait(false);
        var bansTask      = GetPlayersBans(player).ConfigureAwait(false);

        var summaries = (await summariesTask)?[0];
        if(summaries == null)
        {
            return null;
        }

        if(summaries.CommunityVisibilityState == 3)
        {
            var levelTask            = GetPlayerLevel(player.ToString()).ConfigureAwait(false);

            if(includeGames)
                summaries.GamesSummaries = await ParseGames(player.ToString(), countryCode);

            summaries.SteamLevel     = await levelTask;
        }

        summaries.Bans       = (await bansTask)?[0];
        return summaries;
    }

    internal static async Task<PlayerOwnedGamesObject.OwnedGames?> ParseGames(string steamId, string countryCode, bool withDetails = true)
    {
        PlayerOwnedGamesObject.OwnedGames? games = new();
        var gamesPrices                          = new Dictionary<uint, AppDetailsObject>();

        try
        {
            if ((games.Games = await GetPlayerOwnedGames(steamId).ConfigureAwait(false)) == null)
                return null;

            if (games.Games.Length < 1 || !withDetails)
                return games;

            var builder  = new StringBuilder("https://store.steampowered.com/api/appdetails/?appids=");
            var requests = new List<string>(64);
            var locker   = new object();

            for (int i = 0; i < games.Games.Length; i++)
            {
                builder.Append(games.Games[i].AppID);
                if (builder.Length >= WebBrowser.MaxSteamHeaderSize || i == games.Games.Length - 1)
                {
                    requests.Add(builder.Append($"&cc={countryCode}&l=en&filters=price_overview").ToString());
                    builder.Clear().Append("https://store.steampowered.com/api/appdetails/?appids=");
                    continue;
                }
                builder.Append(',');
            }

            await Parallel.ForEachAsync(requests,async (x, token) =>
            {
                for (int i = 0; i < WebBrowser.MaxAttempts; i++)
                {
                    var response = (await WebBrowser.GetStringAsync(x).ConfigureAwait(false))?.InjectionReplace(']', '}')?.InjectionReplace('[', '{');

                    if (response == null || response.Length == 0)
                    {
                        continue;
                    }

                    lock (locker)
                    {
                        gamesPrices = gamesPrices.Concat(JsonSerializer.Deserialize<Dictionary<uint, AppDetailsObject>>(response,App.DefaultJsonOptions)?
                            .Where(o => o.Value.Success && o.Value.Data?.Price_overview != null)!)?.ToDictionary(o => o.Key, o => o.Value);
                    }
                    return;
                }
            }).ConfigureAwait(false);
        }
        finally
        {
            gamesPrices = gamesPrices?.Any() == true ? gamesPrices : null;

            if (games?.Games?.Length >= 1)
            {
                for (int i = 0; i < games.Games.Length; i++)
                {
                    if (games.Games[i].Playtime_forever != 0f)
                    {
                        games.Games[i].Playtime_forever /= 60f;
                        games.HoursOnPlayed += games.Games[i].Playtime_forever;
                        games.PlayedGamesCount++;
                    }

                    if (gamesPrices == null || !gamesPrices.TryGetValue(games.Games[i].AppID, out var details))
                        continue;

                    var formattedPrice            = details!.Data!.Price_overview!.Initial / 100;
                    games.Games[i].FormattedPrice = details?.Data?.Price_overview?.Final_formatted;
                    games.TotalGamesPrice += formattedPrice;
                    games.PaidGames++;
                }

                games.GamesBoundaryBadge = GetGamesBadgeBoundary(games.Games.Length);
            }

        }
        return games;
    }

    internal static async Task<PlayerFriendListObject.Friend[]?> ParseFriends(ulong steamId)
    {
        var friends = await GetPlayerFriends(steamId);

        if (friends == null)
            return null;

        if (friends.Length < 1)
            return friends;

        Array.Sort(friends, (x, y) => x.SteamID.CompareTo(y.SteamID));
        var chunks = new List<PlayerFriendListObject.Friend[]>();

        for (int i = 0; i < friends.Length; i += 100)
        {
            chunks.Add(friends
                .Skip(i)
                .Take(100).ToArray());
        }

        await Parallel.ForEachAsync(chunks,new ParallelOptions { MaxDegreeOfParallelism = WebBrowser.MaxDegreeOfParallelism },
            async (chunk,token) =>
        {
            var summaries = await GetPlayersSummaries(chunk.Select(o => ulong.Parse(o.SteamID)).ToArray()).ConfigureAwait(false);

            if (summaries == null)
                return;

            Array.Sort(summaries, (x, y) => x.SteamID.CompareTo(y.SteamID));

            for (int i = 0; i < chunk.Length; i++)
            {
                chunk[i].Avatarhash = summaries[i].AvatarHash;
                chunk[i].PersonaName = summaries[i].PersonaName;
            }
        }).ConfigureAwait(false);

        return friends;
    }

    #region Helpers
    private static ushort GetGamesBadgeBoundary(int gamesCount)
    {
        if (gamesCount > GamesBadgeBoundaries[^2])
        {
            return GamesBadgeBoundaries[^1];
        }

        for (int i = 0; i < GamesBadgeBoundaries.Length - 1; i++)
        {
            if (gamesCount == GamesBadgeBoundaries[i] || gamesCount < GamesBadgeBoundaries[i + 1])
            {
                return GamesBadgeBoundaries[i];
            }
        }

        return 0;
    }
    #endregion

    #region Steam API requests

    internal static async Task<SteamSummariesObject.SteamSummariesResponse[]?> GetPlayersSummaries(params ulong[] steamIds)
    {
        if (steamIds.Length > 100)
            throw new InvalidOperationException(nameof(steamIds));

        var response = await WebBrowser.GetStringAsync(
            $"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={ApiKey}&steamids={string.Join(",", steamIds)}")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<SteamSummariesObject>(response, App.DefaultJsonOptions)?.Response?.Players;
    }

    internal static async Task<int?> GetPlayerLevel(string steamId)
    {
        var response = await WebBrowser.GetStringAsync(
            $"http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key={ApiKey}&steamid={steamId}")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<PlayerLevelObject>(response, App.DefaultJsonOptions).Response.Player_level;
    }

    internal static async Task<PlayerBansObject.PlayerBansResponse[]?> GetPlayersBans(params ulong[] steamIds)
    {
        if (steamIds.Length > 100)
            throw new InvalidOperationException(nameof(steamIds));

        var response = await WebBrowser.GetStringAsync(
            $"http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key={ApiKey}&steamids={string.Join(",", steamIds)}")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<PlayerBansObject>(response, App.DefaultJsonOptions)?.Players;
    }

    internal static async Task<PlayerOwnedGamesObject.Game[]?> GetPlayerOwnedGames(string steamId)
    {
        var response = await WebBrowser.GetStringAsync(
            $"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={ApiKey}&steamid={steamId}&include_appinfo=true&include_played_free_games=1")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<PlayerOwnedGamesObject>(response, App.DefaultJsonOptions)?.Response?.Games ?? Array.Empty<PlayerOwnedGamesObject.Game>();
    }

    internal static async Task<PlayerFriendListObject.Friend[]?> GetPlayerFriends(ulong steamId)
    {
        var response = await WebBrowser.GetStringAsync(
            $"http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?relationship=friend&key={ApiKey}&steamid={steamId}")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<PlayerFriendListObject>(response, App.DefaultJsonOptions)?.FriendsList?.Friends ?? Array.Empty<PlayerFriendListObject.Friend>();
    }
    #endregion
}