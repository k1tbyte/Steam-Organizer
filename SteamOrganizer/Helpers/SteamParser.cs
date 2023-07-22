using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SteamOrganizer.Helpers
{
    internal static class SteamParser
    {
        private static readonly ushort[] GamesBadgeBoundaries = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
             }; 

        internal enum EParseResult : byte
        {
            OK,
            NoValidAccounts,
            NoAccountsWithID,
            AttemptsExceeded,
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

            internal class Game
            {
                public int AppID;
                public float Playtime_forever;
                public long Rtime_last_played;
            }

            public OwnedGamesResponse Response;
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

        internal static void GetGamesBadgeBoundary(Account account)
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


            acc.AvatarHash      = summary.Avatarhash;
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
        
        private static bool SetGamesInfo(this Account acc, UserOwnedGamesObject.Game[] games)
        {
            if (games == null)
            {
                return false;
            }

            if(games.Length < 1)
            {
                return true;
            }
                

            acc.HoursOnPlayed = acc.PlayedGamesCount = 0;
            acc.GamesCount    = games.Length;

            for (int i = 0; i < games.Length; i++)
            {
                if (games[i].Playtime_forever != 0)
                {
                    games[i].Playtime_forever /= 60;
                    acc.HoursOnPlayed += games[i].Playtime_forever;
                    acc.PlayedGamesCount++;
                }
            }

            GetGamesBadgeBoundary(acc);
            return true;
        }


        /// <returns>Returns a list of accounts whose information could not be retrieved due to an error. Or null if internal error</returns>
        internal static async Task<(List<Account>,EParseResult)> ParseInfo(IList<Account> accounts)
        {
            if (accounts == null || accounts.Count == 0)
            {
                return (null,EParseResult.NoValidAccounts);
            }
                
            var valid = accounts.Where(o => o.SteamID64 != null).ToDictionary(o => o.SteamID64.Value);

            if (!valid.Any())
            {
                return (null, EParseResult.NoAccountsWithID);
            }

            var errorAccsList = new List<Account>();

            // A chunk consists of a maximum of 100 accounts because
            // the maximum number of IDs that GetPlayerSummaries and GetPlayerBans accepts
            for (int i = 0,attempt = 0; i < valid.Count(); i += 100)
            {
                var chunk = valid
                    .Skip(i)
                    .Take(100)
                    .Select(o => o.Key).ToArray();

                var summariesTask = GetPlayersSummaries(chunk).ConfigureAwait(false);
                var bansTask      = GetPlayersBans(chunk).ConfigureAwait(false);

                var summaries = await summariesTask;
                var bans      = (await bansTask).ToDictionary(o => o.SteamId);

                if((summaries == null || bans == null) && App.WebBrowser.LastStatusCode != System.Net.HttpStatusCode.OK)
                {
                    if(++attempt >= WebBrowser.MaxAttempts)
                    {
                        return (null, EParseResult.AttemptsExceeded);
                    }

                    await Task.Delay(WebBrowser.RetryRequestDelay);
                    i -= 100;
                    continue;
                }

                // We don't have Parallel.ForEachAsync and need to somehow wait for all tasks to complete, so we use this
                var pool     = new List<Task>(chunk.Length);

                Parallel.ForEach(summaries,async (accSummary,state) =>
                {
                    var acc = valid[accSummary.SteamId];
                    acc.SetSummaries(accSummary);
                    acc.SetBansInfo(bans[accSummary.SteamId]);

                    // It is useless to receive further information - private profile
                    if (acc.VisibilityState != 3)
                    {
                        acc.LastUpdateDate = DateTime.Now;
                        return;
                    }    

                    var levelTask = GetPlayerLevel(accSummary.SteamId);
                    var gamesTask = GetPlayerOwnedGames(accSummary.SteamId);
                    pool.Add(gamesTask);

                    // If we received the GamesResponse as null, then most likely
                    // the level could not be obtained either, so we add the account to the list with an error
                    if (acc.SetGamesInfo(await gamesTask))
                    {
                        errorAccsList.Add(acc);
                        return;
                    }

                    acc.SteamLevel     = (await levelTask) ?? acc.SteamLevel;
                    acc.LastUpdateDate = DateTime.Now;
                });

                await Task.WhenAll(pool).ConfigureAwait(false);
            }

            return  (errorAccsList.Count > 0 ? errorAccsList : null,EParseResult.OK);
        }

        internal static async Task<EParseResult> ParseInfo(Account account)
        {
            if (account == null)
                return EParseResult.NoValidAccounts;

            if (account.SteamID64 == null)
                return EParseResult.NoAccountsWithID;

            if (!account.SetSummaries((await GetPlayersSummaries(account.SteamID64.Value).ConfigureAwait(false))?[0]))
                return EParseResult.AttemptsExceeded;

            var bansTask = GetPlayersBans(account.SteamID64.Value).ConfigureAwait(false);
            var levelTask = GetPlayerLevel(account.SteamID64.Value).ConfigureAwait(false);
            var gamesTask = GetPlayerOwnedGames(account.SteamID64.Value);

            var bans = await bansTask;
            var level = await levelTask;
            var games = await gamesTask;

            account.SteamLevel = level ?? account.SteamLevel;
            account.SetBansInfo(bans?[0]);
            account.SetGamesInfo(games);

            return EParseResult.OK;
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
                $"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId}&include_appinfo=true&include_played_free_games=1&format=json")
                .ConfigureAwait(false);

            return response == null ? null : JsonConvert.DeserializeObject<UserOwnedGamesObject>(response).Response.Games;
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
