using System.Text;
using System.Text.Json;
using SteamOrganizer.Server.Lib;
using SteamOrganizer.Server.Services.SteamParser.Responses;

namespace SteamOrganizer.Server.Services.SteamParser;

internal enum ESteamApiResult : byte
{
    OK,
    NoValidAccounts,
    NoAccountsWithID,
    AttemptsExceeded,
    OperationCanceled,
    InternalError,
}


public sealed class SteamParser(HttpClient httpClient,CacheManager cache, string apiKey)
{
    public const int MaxAttempts        = 5;
    public const int RetryRequestDelay  = 5000;
    public const int MaxSteamQuerySize = 7300;
    
    private static readonly ushort[] GamesBadgeBoundaries =
    [
        1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,
        15000,16000,17000,18000,20000,21000, 22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
    ];

    private Currency _currency  = Currency.Default;

    public SteamParser SetCurrency(string? currencyName)
    {
        if (currencyName != null && Currency.Currencies.TryGetValue(currencyName, out var currency))
        {
            _currency = currency;
        }

        return this;
    }
    
    private static ushort GetGamesBadgeBoundary(int gamesCount)
    {
        if (gamesCount < 1) return 0;
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
    
    internal async Task<PlayerSummaries?> GetInfo(ulong id, 
        bool withGames, CancellationToken token = default)
    {
        var summariesTask = GetPlayerSummaries(id).ConfigureAwait(false);
        var bansTask      = GetPlayerBans(id).ConfigureAwait(false);

        var summaries = (await summariesTask)?[0];
        if(summaries == null)
        {
            return null;
        }

        if(summaries.CommunityVisibilityState == 3)
        {
            var levelTask            = GetPlayerLevel(id).ConfigureAwait(false);

            if (withGames)
            {
                summaries.GamesSummaries = await GetGames(id, token);
            }

            summaries.SteamLevel     = await levelTask;
        }

        summaries.Bans       = (await bansTask)?[0];
        return summaries;
    }
    
    internal async Task<ESteamApiResult> GetInfo(ulong[] ids,
        bool withGames,
        CancellationToken token,
        Action<PlayerSummaries> callback)
    {
        /*try
        {
            var span = ids.AsSpan();
            // A chunk consists of a maximum of 100 accounts because
            // the maximum number of IDs that GetPlayerSummaries and GetPlayerBans accepts
            for (int i = 0, attempt = 0, remainingCount = players.Length; i < players.Length; i += 100)
            {
                var summariesTask = GetPlayerSummaries(ids.AsSpan()).ConfigureAwait(false);
                var bansTask      = GetPlayersBans(chunk).ConfigureAwait(false);

                var summaries = await summariesTask;
                var bans = (await bansTask)?.ToDictionary(o => o.SteamID);

                if (summaries == null || bans == null)
                {
                    if (++attempt >= WebBrowser.MaxAttempts)
                    {
                        return ESteamApiResult.AttemptsExceeded;
                    }

                    await Task.Delay(WebBrowser.RetryRequestDelay,token);
                    i -= 100;
                    continue;
                }

                await Parallel.ForEachAsync(summaries, new ParallelOptions { MaxDegreeOfParallelism = 2, CancellationToken = token },
                    async (player, token) =>
                {
                    player.Bans       = bans[player.SteamID];

                    if (player.CommunityVisibilityState == 3)
                    {
                        player.SteamLevel     = await GetPlayerLevel(player.SteamID).ConfigureAwait(false); 
                        
                        if(includeGames)
                        {
                            player.GamesSummaries = await ParseGames(player.SteamID, countryCode, token).ConfigureAwait(false);
                        }
                    }

                    callback?.Invoke(player);
                }).ConfigureAwait(false);

            }
        }
        catch(OperationCanceledException)
        {
            return ESteamApiResult.OperationCanceled;
        }
        catch
        {
            return ESteamApiResult.InternalError;
        }*/

        return ESteamApiResult.OK;
    }

    #region Game info parsing
    
    internal async Task<PlayerGames?> GetGames(ulong steamId,CancellationToken token, bool withDetails = true)
    {
        var games = new PlayerGames();
        var prices = new Dictionary<uint, GameDetails>();

        try
        {
            if ((games.Games = await GetPlayerGames(steamId).ConfigureAwait(false)) == null)
                return null;
            
            if (games.Games.Length < 1 || !withDetails)
                return games;

            var builder = new StringBuilder();
            var requests = new List<string>(64);

            foreach (var info in games.Games)
            {
                if (info.Playtime_forever != 0f)
                {
                    info.Playtime_forever /= 60f;
                    games.HoursOnPlayed += info.Playtime_forever;
                    games.PlayedGamesCount++;
                }
                
                if (cache.GetCachedData<GameDetails>($"{info.AppId}_{_currency.Name}", out var cachedDetails))
                {
                    FormatPrice(games, info, cachedDetails!);
                    continue;
                }

                builder.Append(info.AppId);
                if (builder.Length >= MaxSteamQuerySize)
                {
                    requests.Add(WrapRequest(builder));
                    continue;
                }

                builder.Append(',');
            }

            if (builder.Length != 0)
            {
                requests.Add(WrapRequest(builder));
            }

            if (requests.Count > 0)
                await ParseGameInfoRequests(requests, token, prices);
        }
        catch (OperationCanceledException)
        {
            return games;
        }
        finally
        {
            if (games.Games?.Length > 0)
            {
                if (prices.Count > 0)
                {
                    foreach (var info in games.Games)
                    {
                        if (info.FormattedPrice != null ||
                            !prices.TryGetValue(info.AppId, out var details))
                            continue;

                        if (details.Data?.Price_overview != null)
                        {
                            details.Data.Price_overview.Initial /= 100;
                        }
                        FormatPrice(games,info, details);

                        cache.SetCachedData(
                            $"{info.AppId}_{_currency.Name}", details,
                            TimeSpan.FromHours(12)
                        );
                    }
                }
                
                games.GamesPriceFormatted = _currency.Format(games.GamesPrice);
                

                games.GamesCount = games.Games.Length;
                games.GamesBoundaryBadge = GetGamesBadgeBoundary(games.Games.Length);
            }
        }

        return games;

        string WrapRequest(StringBuilder builder)
        {
            var request = builder.Append($"&cc={_currency.CountryCode}&l=en&filters=price_overview")
                .Insert(0, "https://store.steampowered.com/api/appdetails/?appids=").ToString();
            builder.Clear();
            return request;
        }
    }
        
    private Task ParseGameInfoRequests(List<string> requests,
        CancellationToken cancellationToken,
        Dictionary<uint, GameDetails> gamesPrices)
    {
        var options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount,
            CancellationToken = cancellationToken
        };
        
        return Parallel.ForEachAsync(requests, options, async (x, token) =>
        {
            for (int i = 0; i < MaxAttempts; i++)
            {
                var response = (await httpClient.TryGetString(x).ConfigureAwait(false))?
                    .MutableReplace(']', '}')?.MutableReplace('[', '{');

                if (string.IsNullOrEmpty(response))
                {
                    continue;
                }
                
                foreach (var item in 
                         JsonSerializer.Deserialize<Dictionary<uint, GameDetails>>(response, Defines.JsonOptions)!)
                {
                    gamesPrices.Add(item.Key, item.Value);
                }
                return;
            }
        });
    }


    /// <param name="games">Root object games response</param>
    /// <param name="gameInfo">Info from current game</param>
    /// <param name="details">Game details</param>
    private void FormatPrice(PlayerGames games, PlayerGameInfo gameInfo, GameDetails details)
    {
        if (details.Data?.Price_overview == null)
        {
            gameInfo.FormattedPrice = details.Success ? "Free" : "Unknown";
            return;
        }

        var price = details.Data.Price_overview;
        games.GamesPrice += price.Initial;
        gameInfo.FormattedPrice = price.Formatted ?? (price.Formatted = _currency.Format(price.Initial));
        games.PaidGames++;
    }
    
    #endregion
    
    #region Steam API requests

    internal async Task<PlayerBans[]?> GetPlayerBans(params ulong[] steamIds)
    {
        var response = await httpClient.TryGetString(
            $"ISteamUser/GetPlayerBans/v1/?key={apiKey}&steamids={string.Join(",", steamIds)}"
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerBansResponse>(response, Defines.JsonOptions)?.Players;
    }
    
    internal async Task<PlayerSummaries[]?> GetPlayerSummaries(params ulong[] steamIds)
    {
        var response = await httpClient.TryGetString(
            $"ISteamUser/GetPlayerSummaries/v0002/?key={apiKey}&steamids={string.Join(",", steamIds)}"
        ).ConfigureAwait(false);

        return response == null ? null : 
            JsonSerializer.Deserialize<PlayerSummariesResponse>(response, Defines.JsonOptions)?.Response?.Players;
    }
    
    internal async Task<PlayerFriend[]?> GetPlayerFriends(ulong steamId)
    {
        var response = await httpClient.TryGetString(
            $"ISteamUser/GetFriendList/v0001/?relationship=friend&key={apiKey}&steamid={steamId}"
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerFriendsResponse>(response, Defines.JsonOptions)?.FriendsList?.Friends;
    }
    
    internal async Task<PlayerGameInfo[]?> GetPlayerGames(ulong steamId)
    {
        var response = await httpClient.TryGetString(
            $"IPlayerService/GetOwnedGames/v0001/?key={apiKey}&steamid={steamId}&include_appinfo=true&include_played_free_games=1"
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerGamesResponse>(response, Defines.JsonOptions)?.Response?.Games;
    }
    
    internal async Task<int?> GetPlayerLevel(ulong steamId)
    {
        var response = await httpClient.TryGetString(
            $"IPlayerService/GetSteamLevel/v1/?key={apiKey}&steamid={steamId}"
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerLevelResponse>(response, Defines.JsonOptions).Response.Player_level;
    }
    
    #endregion
}