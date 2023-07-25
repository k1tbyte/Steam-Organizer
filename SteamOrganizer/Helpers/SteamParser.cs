using Newtonsoft.Json;
using SteamKit2;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SteamOrganizer.Helpers
{
    internal static class SteamParser
    {
        private static readonly ushort[] GamesBadgeBoundaries = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
             };

        private static readonly UserOwnedGamesObject.Game[] GamesDummy = new UserOwnedGamesObject.Game[0];

        internal enum EParseResult : byte
        {
            OK,
            NoValidAccounts,
            NoAccountsWithID,
            AttemptsExceeded,
            OperationCanceled,
            InternalError,
        }

        #region Responses
        #region Bans
        internal enum EconomyBanType : byte
        {
            none,
            probation,
            banned,
        }
        internal class UserBansObject
        {
            internal class Player
            {
                public ulong SteamId;
                public bool CommunityBanned;
                public int NumberOfVacBans;
                public int NumberOfGameBans;
                public int DaysSinceLastBan;
                public EconomyBanType EconomyBan;
            }

            public Player[] Players;
        }
        #endregion

        #region Level
        private struct UserLevelObject
        {
            internal struct LevelResponse
            {
                public int? Player_level;
            }

            public LevelResponse Response;
        }
        #endregion

        #region Summaries
        internal class UserSummariesObject
        {
            internal class Player
            {
                public ulong SteamId;
                public string Avatarhash;
                public string Personaname;
                public string ProfileURL;
                public long? TimeCreated;
                public byte CommunityVisibilityState;
            }

            internal class SummariesResponse
            {
                public Player[] Players;
            }

            public SummariesResponse Response;
        }
        #endregion

        #region Games
        internal class UserOwnedGamesObject
        {
            internal class OwnedGamesResponse
            {
                public Game[] Games;
            }

            [Serializable]
            internal class Game
            {
                public uint AppID;
                public float Playtime_forever;
                public string Name;

                [JsonIgnore]
                public uint? Price;
            }

            public OwnedGamesResponse Response;
        }

        internal class AppDetailsObject
        {
            internal class AppPrice
            {
                public ECurrencyCode Currency;
                public uint Initial;
            }
            internal class AppData
            {
                public AppPrice Price_overview;
            }

            public bool Success;
            public AppData Data;
        }
        #endregion

        #region Friends
        internal class UserFriendsObject
        {
            internal class UserFriendsResponse
            {
                public Friend[] Friends;
            }

            internal class Friend
            {
                public ulong SteamID;
                public long Friend_since;
            }

            public UserFriendsResponse FriendsList;
        }
        #endregion 
        #endregion

        internal static void SetGamesBadgeBoundary(Account account)
        {
            if (account.GamesCount > GamesBadgeBoundaries[GamesBadgeBoundaries.Length - 2])
            {
                account.GamesBadgeBoundary = GamesBadgeBoundaries[GamesBadgeBoundaries.Length - 1];
                return;
            }

            for (int i = 0; i < GamesBadgeBoundaries.Length - 1; i++)
            {
                if (account.GamesCount == GamesBadgeBoundaries[i] || account.GamesCount < GamesBadgeBoundaries[i + 1])
                {
                    account.GamesBadgeBoundary = GamesBadgeBoundaries[i];
                    break;
                }
            }   
        }

        private static bool SetSummaries(this Account acc,UserSummariesObject.Player summary)
        {
            if (summary == null)
            {
                return false;
            }


            if(acc.AvatarHash != summary.Avatarhash)
            {
                acc.AvatarHash = summary.Avatarhash;
                acc.LoadImage();
            }
            acc.Nickname        = summary.Personaname;
            acc.VisibilityState = summary.CommunityVisibilityState;
            var id              = summary.ProfileURL.Split('/');
            acc.VanityURL       = id[3] == "id" ? id[4] : acc.VanityURL;
            acc.CreatedDate     = summary.TimeCreated == null ? acc.CreatedDate : Utils.UnixTimeToDateTime(summary.TimeCreated.Value);

            return true;
        }

        private static bool SetBansInfo(this Account acc, UserBansObject.Player bans)
        {
            if (bans == null)
            {
                return false;
            }


            acc.GameBansCount    = bans.NumberOfGameBans;
            acc.VacBansCount     = bans.NumberOfVacBans;
            acc.HaveCommunityBan = bans.CommunityBanned;
            acc.DaysSinceLastBan = bans.DaysSinceLastBan;
            acc.EconomyBan       = (int)bans.EconomyBan;
            return true;
        }


        /// <param name="accounts">list of accounts to update</param>
        /// <param name="processingCallback">Args: Current account, Remaining accounts count, Completed successfully </param>
        internal static async Task<EParseResult> ParseInfo(IList<Account> accounts,CancellationToken cancelToken, Action<Account,int,bool> processingCallback = null)
        {
            if (accounts == null || accounts.Count == 0)
            {
                return EParseResult.NoValidAccounts;
            }
                
            var valid = accounts.Where(o => o.SteamID64 != null).ToDictionary(o => o.SteamID64.Value);

            if (!valid.Any())
            {
                return EParseResult.NoAccountsWithID;
            }

            processingCallback?.Invoke(null, valid.Count,true);

            try
            {
                // A chunk consists of a maximum of 100 accounts because
                // the maximum number of IDs that GetPlayerSummaries and GetPlayerBans accepts
                for (int i = 0, attempt = 0,remainingCount = valid.Count; i < valid.Count; i += 100)
                {
                    var chunk = valid
                        .Skip(i)
                        .Take(100)
                        .Select(o => o.Key).ToArray();

                    var summariesTask = GetPlayersSummaries(chunk).ConfigureAwait(false);
                    var bansTask      = GetPlayersBans(chunk).ConfigureAwait(false);

                    var summaries = await summariesTask;
                    var bans      = (await bansTask).ToDictionary(o => o.SteamId);

                    if (summaries == null || bans == null)
                    {
                        if (++attempt >= WebBrowser.MaxAttempts)
                        {
                            return EParseResult.AttemptsExceeded;
                        }

                        await Task.Delay(WebBrowser.RetryRequestDelay);
                        i -= 100;
                        continue;
                    }

                    Parallel.ForEach(summaries,new ParallelOptions{ CancellationToken = cancelToken },
                    (accSummary, state) =>
                    {
                        var success = true;
                        var acc = valid[accSummary.SteamId];
                        acc.IsCurrentlyUpdating = true;

                        acc.SetSummaries(accSummary);
                        acc.SetBansInfo(bans[accSummary.SteamId]);
                        acc.LastUpdateDate = DateTime.Now;

                        // It is useless to receive further information - private profile
                        if (acc.VisibilityState == 3)
                        {
                            var levelTask = GetPlayerLevel(accSummary.SteamId);

                            // If we received the GamesResponse as null, then most likely
                            // the level could not be obtained either, so we add the account to the list with an error
                            if (!ParseGames(acc).Result)
                            {
                                success = false;
                            }
                            else
                            {
                                acc.SteamLevel = levelTask.Result ?? acc.SteamLevel;
                            }
                        }
                        processingCallback?.Invoke(acc, --remainingCount, success);
                        acc.IsCurrentlyUpdating = false;
                    });
                }
            }
            catch(OperationCanceledException)
            {
                return EParseResult.OperationCanceled;
            }
            catch(Exception e)
            {
                App.Logger.Value.LogHandledException(e);
                return EParseResult.InternalError;
            }

            return  EParseResult.OK;
        }

        internal static async Task<EParseResult> ParseInfo(Account account)
        {
            if (account == null)
                return EParseResult.NoValidAccounts;

            if (account.SteamID64 == null)
                return EParseResult.NoAccountsWithID;

            if (account.AvatarHash != null)
                account.LastUpdateDate = DateTime.Now;

            if (!account.SetSummaries((await GetPlayersSummaries(account.SteamID64.Value).ConfigureAwait(false))?[0]))
                return EParseResult.AttemptsExceeded;

            var bansTask  = GetPlayersBans(account.SteamID64.Value).ConfigureAwait(false);
            var gamesTask = ParseGames(account);
            var levelTask = GetPlayerLevel(account.SteamID64.Value).ConfigureAwait(false);

            var bans  = await bansTask;
            var level = await levelTask;
            _ = await gamesTask;

            account.SteamLevel = level ?? account.SteamLevel;
            account.SetBansInfo(bans?[0]);

            return EParseResult.OK;
        }

        internal static async Task<bool> ParseGames(Account acc, bool withDetails = true)
        {
            UserOwnedGamesObject.Game[] games = null;
            Dictionary<uint, AppDetailsObject> gamesPrices = null;

            try
            {
                if (acc.SteamID64 == null || acc.VisibilityState != 3 || (games = await GetPlayerOwnedGames(acc.SteamID64.Value)) == null)
                    return false;

                if (games.Length < 1 || !withDetails)
                    return true;

                var response = (await App.WebBrowser.GetStringAsync(
                    $"https://store.steampowered.com/api/appdetails/?appids={string.Join(",", games.Select(o => o.AppID))}&l=en&filters=price_overview")
                    )?.InjectionReplace(']', '}')?.InjectionReplace('[', '{');

                if (response == null)
                    return false;

                gamesPrices = JsonConvert.DeserializeObject<Dictionary<uint, AppDetailsObject>>(response)?
                    .Where(o => o.Value.Success && o.Value.Data?.Price_overview != null)?.ToDictionary(o => o.Key, o => o.Value);

                gamesPrices = gamesPrices?.Any() == true ? gamesPrices : null;
            }
            finally
            {
                if (games?.Length >= 1)
                {
                    acc.HoursOnPlayed = acc.PlayedGamesCount = 0;
                    acc.GamesCount = games.Length;
                    acc.TotalGamesPrice = 0UL;
                    acc.GamesCurrency = gamesPrices == null ? ECurrencyCode.Invalid : gamesPrices.First().Value.Data.Price_overview.Currency;

                    for (int i = 0; i < games.Length; i++)
                    {
                        if (games[i].Playtime_forever != 0f)
                        {
                            games[i].Playtime_forever /= 60f;
                            acc.HoursOnPlayed += games[i].Playtime_forever;
                            acc.PlayedGamesCount++;
                        }

                        if (gamesPrices == null || !gamesPrices.TryGetValue(games[i].AppID, out AppDetailsObject details))
                            continue;

                        var formattedPrice = details.Data.Price_overview.Initial / 100;
                        games[i].Price = formattedPrice;
                        acc.TotalGamesPrice += formattedPrice;
                    }

                    SetGamesBadgeBoundary(acc);
                    FileCryptor.Serialize(games, System.IO.Path.Combine(CachingManager.GamesCachePath, acc.SteamID64.ToString()));
                }

            }

            return true;
        }

        internal static async Task<int?> GetPlayerLevel(ulong steamId64)
        {
            var response =  await App.WebBrowser.GetStringAsync(
                $"http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId64}")
                .ConfigureAwait(false);

            return response == null ? null : JsonConvert.DeserializeObject<UserLevelObject>(response).Response.Player_level;
        }

        internal static async Task<UserSummariesObject.Player[]> GetPlayersSummaries(params ulong[] steamIds)
        {
            if (steamIds.Length > 100)
                throw new InvalidOperationException(nameof(steamIds));

            var response = await App.WebBrowser.GetStringAsync(
                $"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamids={string.Join(",", steamIds)}")
                .ConfigureAwait(false);

            return response == null ? null : JsonConvert.DeserializeObject<UserSummariesObject>(response).Response.Players;
        }
        
        internal static async Task<UserBansObject.Player[]> GetPlayersBans(params ulong[] steamIds)
        {
            if (steamIds.Length > 100)
                throw new InvalidOperationException(nameof(steamIds));

            var response = await App.WebBrowser.GetStringAsync(
                $"http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamids={string.Join(",", steamIds)}")
                .ConfigureAwait(false);

            return response == null ? null : JsonConvert.DeserializeObject<UserBansObject>(response).Players;
        }

        internal static async Task<UserOwnedGamesObject.Game[]> GetPlayerOwnedGames(ulong steamId)
        {
            var response = await App.WebBrowser.GetStringAsync(
                $"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId}&include_appinfo=true&include_played_free_games=1")
                .ConfigureAwait(false);

            return response == null ? null : JsonConvert.DeserializeObject<UserOwnedGamesObject>(response).Response.Games ?? GamesDummy;
        }

        internal static async Task<UserFriendsObject.Friend[]> GetPlayerFriends(ulong steamId)
        {
            var response = await App.WebBrowser.GetStringAsync(
                $"http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?relationship=friend&key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId}")
                .ConfigureAwait(false);

            return response == null ? null : JsonConvert.DeserializeObject<UserFriendsObject>(response).FriendsList.Friends;
        }
    }
}
