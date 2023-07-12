using Newtonsoft.Json;
using System;
using System.Threading.Tasks;

namespace SteamOrganizer.Helpers
{
    internal static class SteamParser
    {
        #region Responses
        #region Bans
        internal enum TradeBanType
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
                public int DaysSinceLastBan;
                public TradeBanType EconomyBan;
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
                public long Playtime_forever;
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

        internal static async Task<int?> GetPlayerLevel(ulong steamId64)
        {
            var response =  await App.WebBrowser.GetStringAsync(
                $"http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId64}");

            return response == null ? null : JsonConvert.DeserializeObject<UserLevelObject>(response).Response.Player_level;
        }

        internal static async Task<UserSummariesObject.Player[]> GetPlayersSummaries(params ulong[] steamIds)
        {
            if (steamIds.Length > 100)
                throw new InvalidOperationException(nameof(steamIds));

            var response = await App.WebBrowser.GetStringAsync($"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamids={string.Join(",", steamIds)}");

            return response == null ? null : JsonConvert.DeserializeObject<UserSummariesObject>(response).Response.Players;
        }
        
        internal static async Task<UserBansObject.Player[]> GetPlayersBans(params ulong[] steamIds)
        {
            if (steamIds.Length > 100)
                throw new InvalidOperationException(nameof(steamIds));

            var response = await App.WebBrowser.GetStringAsync($"http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamids={string.Join(",", steamIds)}");

            return response == null ? null : JsonConvert.DeserializeObject<UserBansObject>(response).Players;
        }

        internal static async Task<UserOwnedGamesObject.Game[]> GetPlayerOwnedGames(ulong steamId)
        {
            var response = await App.WebBrowser.GetStringAsync($"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId}&include_appinfo=true&include_played_free_games=1&format=json");

            return response == null ? null : JsonConvert.DeserializeObject<UserOwnedGamesObject>(response).Response.Games;
        }

        internal static async Task<UserFriendsObject.Friend[]> GetPlayerFriends(ulong steamId)
        {
            var response = await App.WebBrowser.GetStringAsync($"http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?relationship=friend&key={App.Config.SteamApiKey ?? App.STEAM_API_KEY}&steamid={steamId}");

            return response == null ? null : JsonConvert.DeserializeObject<UserFriendsObject>(response).FriendsList.Friends;
        }
    }
}
