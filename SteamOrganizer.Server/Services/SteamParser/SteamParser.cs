using System.Text;
using System.Text.Json;
using SteamOrganizer.Server.Lib;
using SteamOrganizer.Server.Services.SteamParser.Responses;

namespace SteamOrganizer.Server.Services.SteamParser;

internal enum ESteamApiResult : byte
{
    OK,
    AttemptsExceeded,
    OperationCanceled,
    InternalError,
}


public sealed class SteamParser(HttpClient httpClient, string apiKey, CancellationToken cancellation)
{
    public const int MaxAttempts        = 3;
    public const int RetryRequestDelay  = 5000;
    public const int MaxSteamQuerySize = 7300;
    
    private static readonly ushort[] GamesBadgeBoundaries =
    [
        1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,
        15000,16000,17000,18000,20000,21000, 22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
    ];

    private Currency _currency  = Currency.Default;
    private Bucket<uint,GameDetails> _cache = CacheManager.GetBucket<uint,GameDetails>("gameprices_" + Currency.Default.CountryCode);
    public CancellationToken Cancellation { get; set; } = cancellation;

    public SteamParser SetCurrency(string? currencyName)
    {
        if (currencyName != null && Currency.Currencies.TryGetValue(currencyName.ToUpperInvariant(), out var currency)
            && !Equals(currency, _currency))
        {
            _currency = currency;
            _cache = CacheManager.GetBucket<uint,GameDetails>("gameprices_" + _currency.CountryCode);
        }

        return this;
    }
    
    
    internal async Task<PlayerSummaries?> GetPlayerInfo(ulong id, bool withGames)
    {
        var summariesTask = GetPlayerSummaries([id]).ConfigureAwait(false);
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
                summaries.GamesSummaries = await GetGames(id);
            }

            summaries.SteamLevel     = await levelTask;
        }

        summaries.Bans       = (await bansTask)?[0];
        return summaries;
    }
    
    internal async Task<ESteamApiResult> GetPlayerInfo(HashSet<ulong> ids, bool withGames,
        Func<PlayerSummaries, CancellationToken, Task>? callback = null)
    {
        try
        {
            // A chunk consists of a maximum of 100 accounts because
            // the maximum number of IDs that GetPlayerSummaries and GetPlayerBans accepts
            for (int i = 0, attempt = 0; i < ids.Count; i += 100)
            {
                var chunk = ids.Skip(i).Take(100).ToArray();

                var summariesTask = GetPlayerSummaries(chunk).ConfigureAwait(false);
                var bansTask      = GetPlayerBans(chunk).ConfigureAwait(false);

                var summaries = await summariesTask;
                var bans = (await bansTask)?.ToDictionary(o => o.SteamId);
                

                if (summaries == null || bans == null)
                {
                    if (++attempt >= MaxAttempts)
                    {
                        return ESteamApiResult.AttemptsExceeded;
                    }

                    await Task.Delay(RetryRequestDelay, Cancellation);
                    i -= 100;
                    continue;
                }

                await Parallel.ForEachAsync(summaries,
                    new ParallelOptions { MaxDegreeOfParallelism = 2, CancellationToken = Cancellation },
                    async (player, _) =>
                    {
                        player.Bans       = bans[player.SteamId];

                        if (player.CommunityVisibilityState == 3)
                        {
                            player.SteamLevel     = await GetPlayerLevel(player.SteamId).ConfigureAwait(false); 
                        
                            if(withGames)
                            {
                                player.GamesSummaries = await GetGames(player.SteamId).ConfigureAwait(false);
                            }
                        }

                        if (callback != null)
                        {
                            await callback(player, Cancellation);
                        }
                    }
                ).ConfigureAwait(false);
            }
        }
        catch(OperationCanceledException)
        {
            return ESteamApiResult.OperationCanceled;
        }
        catch
        {
            return ESteamApiResult.InternalError;
        }

        return ESteamApiResult.OK;
    }

    internal async Task<PlayerFriend[]?> GetFriendsInfo(ulong steamId)
    {
        var friends = await GetPlayerFriends(steamId);

        if (friends == null || friends.Length < 1)
            return friends;
        
        Array.Sort(friends, IdComparator);
        
        await Parallel.ForAsync(0, (int)Math.Ceiling(friends.Length / 100f),
            new ParallelOptions { CancellationToken = Cancellation },
            async (i, _) =>
            {
                var chunk = friends.Skip(i * 100).Take(100).ToArray();
                var summaries = await GetPlayerSummaries(
                    chunk.Select(o => o.SteamId)
                ).ConfigureAwait(false);
                
                if (summaries == null)
                    return;
                
                Array.Sort(summaries, IdComparator);
                for (var j = 0; j < chunk.Length; j++)
                {
                    chunk[j].AvatarHash = summaries[j].AvatarHash;
                    chunk[j].PersonaName = summaries[j].PersonaName;
                }
            }
        );
        
        return friends;
    }

    #region Game info parsing
    
    internal async Task<PlayerGames?> GetGames(ulong steamId, bool withDetails = true)
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
                
                if (_cache.TryGet(info.AppId, out var cachedDetails))
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
                await ParseGameInfoRequests(requests, prices).ConfigureAwait(false);
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

                        _cache.Store(info.AppId, details, TimeSpan.FromHours(12));
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
        
    private Task ParseGameInfoRequests(List<string> requests, Dictionary<uint, GameDetails> gamesPrices)
    {
        var options = new ParallelOptions
        {
            MaxDegreeOfParallelism = Environment.ProcessorCount,
            CancellationToken = Cancellation
        };
        
        return Parallel.ForEachAsync(requests, options, async (x, token) =>
        {
            for (int i = 0; i < MaxAttempts; i++)
            {
                var response = (await httpClient.TryGetString(x, token).ConfigureAwait(false))?
                    .MutableReplace(']', '}').MutableReplace('[', '{');

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
            $"ISteamUser/GetPlayerBans/v1/?key={apiKey}&steamids={string.Join(",", steamIds)}",
            Cancellation
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerBansResponse>(response, Defines.JsonOptions)?.Players;
    }
    
    internal async Task<PlayerSummaries[]?> GetPlayerSummaries(IEnumerable<ulong> steamIds)
    {
        var response = await httpClient.TryGetString(
            $"ISteamUser/GetPlayerSummaries/v0002/?key={apiKey}&steamids={string.Join(",", steamIds)}",
            Cancellation
        ).ConfigureAwait(false);

        return response == null ? null : 
            JsonSerializer.Deserialize<PlayerSummariesResponse>(response, Defines.JsonOptions)?.Response?.Players;
    }
    
    internal async Task<PlayerFriend[]?> GetPlayerFriends(ulong steamId)
    {
        var response = await httpClient.TryGetString(
            $"ISteamUser/GetFriendList/v0001/?relationship=friend&key={apiKey}&steamid={steamId}",
            Cancellation
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerFriendsResponse>(response, Defines.JsonOptions)?.FriendsList?.Friends;
    }
    
    internal async Task<PlayerGameInfo[]?> GetPlayerGames(ulong steamId)
    {
        var response = await httpClient.TryGetString(
            $"IPlayerService/GetOwnedGames/v0001/?key={apiKey}&steamid={steamId}&include_appinfo=true&include_played_free_games=1",
            Cancellation
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerGamesResponse>(response, Defines.JsonOptions)?.Response?.Games;
    }
    
    internal async Task<int?> GetPlayerLevel(ulong steamId)
    {
        var response = await httpClient.TryGetString(
            $"IPlayerService/GetSteamLevel/v1/?key={apiKey}&steamid={steamId}",
            Cancellation
        ).ConfigureAwait(false);

        return response == null ? null :
            JsonSerializer.Deserialize<PlayerLevelResponse>(response, Defines.JsonOptions).Response.Player_level;
    }
    
    #endregion
    
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
    private static int IdComparator(IIdentifiable x, IIdentifiable y) => x.SteamId.CompareTo(y.SteamId);
    private static ulong ResolveId(ulong id) => id > UInt32.MaxValue ? id : id + Defines.SteamId64Indent;
}