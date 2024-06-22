using System.Net;
using System.Text;
using System.Text.Json;
using SteamOrganizer.Server.Lib;
using SteamOrganizer.Server.Services.SteamParser.Responses;

namespace SteamOrganizer.Server.Services.SteamParser;

public sealed class SteamParser : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    
    public const int MaxAttempts        = 3;
    public const int RetryRequestDelay  = 5000;
    public const int MaxSteamQuerySize = 6300;
    
    private static readonly ushort[] GamesBadgeBoundaries =
    [
        1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,
        15000,16000,17000,18000,20000,21000, 22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
    ];

    private Currency _currency  = Currency.Default;
    private Bucket<uint,GameDetails> _cache = CacheManager.GetBucket<uint,GameDetails>("gameprices_" + Currency.Default.CountryCode);
    
    private CancellationToken _cancellation;
    private CancellationTokenSource? _errorCancellation;
    public CancellationToken Cancellation
    {
        get => _cancellation;
        set
        {
            _errorCancellation?.Cancel();
            _errorCancellation?.Dispose();
            _errorCancellation = CancellationTokenSource.CreateLinkedTokenSource(value);
            _cancellation = _errorCancellation.Token;
        }
    }
    public HttpStatusCode? ErrorCode { get; private set; }

    public SteamParser(HttpClient httpClient, string apiKey, CancellationToken cancellation)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
        Cancellation = cancellation;
    }
    
    public void Dispose()
    {
        _errorCancellation?.Dispose();
    }

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

    public async Task<T?> PerformRequest <T> (Task<T> request, HttpResponse response)
    {
        T? result = default;
        try
        {
            result = await request;
        }
        catch (OperationCanceledException) { }

        if (ErrorCode != null)
        {
            response.StatusCode = (int)ErrorCode.Value;
        }
        
        return result;
    }
    
    internal async Task<PlayerSummaries?> GetPlayerInfo(ulong id, bool withGames)
    {
        var summariesTask = GetPlayerSummaries([id]).ConfigureAwait(false);
        var bansTask      = GetPlayerBans(id).ConfigureAwait(false);
        
        var summaries = (await summariesTask).FirstOrDefault();
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

        summaries.Bans       = (await bansTask).FirstOrDefault();
        return summaries;
    }
    
    internal async Task<int> GetPlayerInfo(HashSet<ulong> ids, bool withGames,
        Func<PlayerSummaries, CancellationToken, Task>? callback = null)
    {
        int processed = 0;
        
        // A chunk consists of a maximum of 100 accounts because
        // the maximum number of IDs that GetPlayerSummaries and GetPlayerBans accepts
        for (int i = 0; i < ids.Count; i += 100)
        {
            var chunk = ids.Skip(i).Take(100).ToArray();

            var summariesTask = GetPlayerSummaries(chunk).ConfigureAwait(false);
            var bansTask      = GetPlayerBans(chunk).ConfigureAwait(false);

            var summaries = await summariesTask;
            var bans = (await bansTask).ToDictionary(o => o.SteamId);

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

                    processed++;
                }
            ).ConfigureAwait(false);
        }

        return processed;
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
                requests.Add(WrapRequest());
                continue;
            }

            builder.Append(',');
        }

        if (builder.Length != 0)
        {
            requests.Add(WrapRequest());
        }

        if (requests.Count > 0)
            await ParseGameInfoRequests(requests, prices).ConfigureAwait(false);
            
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
        
        return games;

        string WrapRequest()
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
        
        return Parallel.ForEachAsync(requests, options, async (x, _) =>
        {
            var response = (await Request<string>(x, MaxAttempts, true).ConfigureAwait(false))?
                .MutableReplace(']', '}').MutableReplace('[', '{');

            if (response == null) return;
                
            foreach (var item in 
                     JsonSerializer.Deserialize<Dictionary<uint, GameDetails>>(response, Defines.JsonOptions)!)
            {
                gamesPrices.Add(item.Key, item.Value);
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

    internal async Task<PlayerBans[]> GetPlayerBans(params ulong[] steamIds)
    {
        var response = await Request<PlayerBansResponse>(
            $"ISteamUser/GetPlayerBans/v1/?key={_apiKey}&steamids={string.Join(",", steamIds)}"
        ).ConfigureAwait(false);

        return response!.Players;
    }
    
    internal async Task<PlayerSummaries[]> GetPlayerSummaries(IEnumerable<ulong> steamIds)
    {
        var response = await Request<PlayerSummariesResponse>(
            $"ISteamUser/GetPlayerSummaries/v0002/?key={_apiKey}&steamids={string.Join(",", steamIds)}"
        ).ConfigureAwait(false);

        return response!.Response.Players;
    }
    
    internal async Task<PlayerFriend[]?> GetPlayerFriends(ulong steamId)
    {
        var response = await Request<PlayerFriendsResponse>(
            $"ISteamUser/GetFriendList/v0001/?relationship=friend&key={_apiKey}&steamid={steamId}"
        ).ConfigureAwait(false);

        return response?.FriendsList?.Friends;
    }
    
    internal async Task<PlayerGameInfo[]?> GetPlayerGames(ulong steamId)
    {
        var response = await Request<PlayerGamesResponse>(
            $"IPlayerService/GetOwnedGames/v0001/?key={_apiKey}&steamid={steamId}&include_appinfo=true&include_played_free_games=1"
        ).ConfigureAwait(false);

        return response?.Response.Games;
    }
    
    internal async Task<int?> GetPlayerLevel(ulong steamId)
    {
        var response = await Request<PlayerLevelResponse>(
            $"IPlayerService/GetSteamLevel/v1/?key={_apiKey}&steamid={steamId}"
        ).ConfigureAwait(false);

        return response?.Response.Player_level;
    }

    internal async Task<ulong?> GetAccountId(string vanityUrl)
    {
        var response = await Request<ResolveVanityResponse>(
            $"ISteamUser/ResolveVanityURL/v0001/?key={_apiKey}&vanityurl={vanityUrl}",3
        ).ConfigureAwait(false);

        return response?.Response?.SteamId;
    }
    
    #endregion

    private async Task<T?> Request <T>(string url, int retries = 0, bool raw = false) where T: class
    {
        retry:
        var response = await _httpClient.GetAsync(url, Cancellation);
            
        if (response.IsSuccessStatusCode)
        {
            var result = raw ? (T)(object)await response.Content.ReadAsStringAsync(_cancellation) :
                await response.Content.ReadFromJsonAsync<T>(Defines.JsonOptions, _cancellation);
            response.Dispose();
            return result;
        }
            
        if (response.StatusCode is HttpStatusCode.TooManyRequests or
                HttpStatusCode.ServiceUnavailable && retries-- > 0)
        {
            await Task.Delay(RetryRequestDelay, _cancellation);
            response.Dispose();
            goto retry;
        }
        
        ErrorCode = response.StatusCode;
        await _errorCancellation!.CancelAsync();
        response.Dispose();
        return null;
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
    private static int IdComparator(IIdentifiable x, IIdentifiable y) => x.SteamId.CompareTo(y.SteamId);
}