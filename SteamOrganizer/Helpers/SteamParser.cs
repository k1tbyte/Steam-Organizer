using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using System;
using System.Threading.Tasks;

namespace SteamOrganizer.Helpers
{
    internal static class SteamParser
    {
        private static readonly ushort[] GamesBadgeBoundaries = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
             };

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

        internal static async Task<bool> ParseInfo(Account account)
        {
            if (account == null || account.SteamID64 == null)
                return false;

            var summaries = await GetPlayersSummaries(account.SteamID64.Value).ConfigureAwait(false);

            if(summaries == null)
                return false;

            var bansTask      = GetPlayersBans(account.SteamID64.Value).ConfigureAwait(false);
            var levelTask     = GetPlayerLevel(account.SteamID64.Value).ConfigureAwait(false);
            var gamesTask     = GetPlayerOwnedGames(account.SteamID64.Value);

            var bans      = await bansTask;
            var level     = await levelTask;
            var games     = await gamesTask;

            account.AvatarHash      = summaries[0].Avatarhash;
            account.Nickname        = summaries[0].Personaname;
            account.VisibilityState = summaries[0].CommunityVisibilityState;
            var id                  = summaries[0].ProfileURL.Split('/');
            account.VanityURL       = id[3] == "id" ? id[4] : null;
            account.CreatedDate     = Utils.UnixTimeToDateTime(summaries[0].TimeCreated ?? 0);

            account.SteamLevel = level;

            if(bans.Length >= 1)
            {
                account.GameBansCount    = bans[0].NumberOfGameBans;
                account.VacBansCount     = bans[0].NumberOfVacBans;
                account.HaveCommunityBan = bans[0].CommunityBanned;
                account.DaysSinceLastBan = bans[0].DaysSinceLastBan;
                account.EconomyBan       = (int)bans[0].EconomyBan;
            }

            account.HoursOnPlayed = account.PlayedGamesCount = 0;
            if (games.Length >= 1)
            {
                account.GamesCount = games.Length;
                for (int i = 0; i < games.Length; i++)
                {
                    if (games[i].Playtime_forever != 0)
                    {
                        games[i].Playtime_forever /= 60;
                        account.HoursOnPlayed += games[i].Playtime_forever;
                        account.PlayedGamesCount++;
                    }
                }

                if (account.GamesCount > GamesBadgeBoundaries[GamesBadgeBoundaries.Length - 2])
                {
                    account.GamesBadgeBoundary = GamesBadgeBoundaries[GamesBadgeBoundaries.Length - 1];
                }
                else
                {
                    for (int i = 0; i < GamesBadgeBoundaries.Length - 1; i++)
                    {
                        if (account.GamesCount == GamesBadgeBoundaries[i] || account.GamesCount < GamesBadgeBoundaries[i + 1])
                        {
                            account.GamesBadgeBoundary = GamesBadgeBoundaries[i];
                            break;
                        }
                    }
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
