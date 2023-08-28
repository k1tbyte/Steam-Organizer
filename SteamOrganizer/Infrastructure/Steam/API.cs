using Newtonsoft.Json;
using SteamKit2;
using SteamOrganizer.Helpers;
using SteamOrganizer.MVVM.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Routing;
using System.Windows;
using System.Windows.Media.Imaging;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.Rebar;

namespace SteamOrganizer.Infrastructure.Steam
{
    internal static class API
    {

        internal enum EParseResult : byte
        {
            OK,
            NoValidAccounts,
            NoAccountsWithID,
            AttemptsExceeded,
            OperationCanceled,
            InternalError,
        }

        internal enum EconomyBanType : byte
        {
            none,
            probation,
            banned,
        }

        #region Responses


        #region Summaries
        internal sealed class PlayerSummaries
        {
            public ulong SteamId { get; set; }
            public string AvatarHash { get; set; }
            public string  PersonaName { get; set; }
            public string ProfileURL { get; set; }
            public string LocCountryCode { get; set; }
            public DateTime? TimeCreated { get; set; }
            public byte CommunityVisibilityState { get; set; }
            public byte CommentPermission { get; set; }
            public int? SteamLevel { get; set; }
            public PlayerBans Bans { get; set; }
            public PlayerGamesSummaries GamesSummaries { get; set; }
        }

        public sealed class PlayerBans
        {
            public bool CommunityBanned { get; set; }
            public int NumberOfVacBans { get; set; }
            public int NumberOfGameBans { get; set; }
            public int DaysSinceLastBan { get; set; }
            public EconomyBanType EconomyBan { get; set; }
        }
        #endregion

        #region Games
        internal class PlayerGamesSummaries
        {
            public Game[] Games;
            public int PlayedGamesCount { get; set; }
            public float HoursOnPlayed { get; set; }
            public ushort GamesBoundaryBadge { get; set; }
            public string GamesPriceFormatted { get; set; }
            public int PaidGames { get; set; }
        }

        [Serializable]
        internal class Game
        {
            public uint AppID { get; set; }
            public float Playtime_forever { get; set; }
            public string Name { get; set; }
            public string FormattedPrice { get; set; }

            [JsonIgnore]
            public BitmapImage BitmapSource => CachingManager.GetGameHeaderPreview(AppID);
        }

        #endregion

        #region Friends
        internal class UserFriendsObject
        {
            internal class UserFriendsResponse
            {
                public Friend[] Friends;
            }

            [Serializable]
            internal class Friend
            {
                public ulong SteamID { get; set; }

                [field: NonSerialized]
                public long Friend_since { get; set; }

                [JsonIgnore]
                public string Avatarhash { get; set; }

                [JsonIgnore]
                public string PersonaName { get; set; }

                [JsonIgnore]
                public DateTime? FriendSinceDate { get; set; }

                [JsonIgnore]
                public BitmapImage BitmapSource => CachingManager.GetCachedAvatar(Avatarhash);

            }

            public UserFriendsResponse FriendsList;
        }
        #endregion 
        #endregion


        private static bool SetSummaries(this Account acc,PlayerSummaries summary)
        {
            if (summary == null)
                return false;

            if (acc.AvatarHash != null)
                acc.LastUpdateDate = DateTime.Now;

            acc.AvatarHash       = summary.AvatarHash;
            acc.Nickname         = summary.PersonaName;
            acc.VisibilityState  = summary.CommunityVisibilityState;
            acc.VanityURL        = summary.ProfileURL ?? acc.VanityURL;
            acc.CreatedDate      = summary.TimeCreated ?? acc.CreatedDate;
            acc.GameBansCount    = summary.Bans.NumberOfGameBans;
            acc.VacBansCount     = summary.Bans.NumberOfVacBans;
            acc.HaveCommunityBan = summary.Bans.CommunityBanned;
            acc.DaysSinceLastBan = summary.Bans.DaysSinceLastBan;
            acc.EconomyBan       = (int)summary.Bans.EconomyBan;
            acc.SteamLevel       = summary.SteamLevel;
            acc.SetGames(summary.GamesSummaries, acc.SteamID64.Value);
            return true;
        }

        private static bool SetGames(this Account acc, PlayerGamesSummaries games,ulong steamid)
        {
            if (games == null)
                return false;

            if (games.Games.Length == 0)
                return true;

            acc.GamesCount         = games.Games.Length;
            acc.GamesBadgeBoundary = games.GamesBoundaryBadge;
            acc.TotalGamesPrice    = games.GamesPriceFormatted;
            acc.PaidGames          = games.PaidGames;
            acc.PlayedGamesCount   = games.PlayedGamesCount;
            acc.HoursOnPlayed      = games.HoursOnPlayed;

            FileCryptor.Serialize(games.Games, System.IO.Path.Combine(CachingManager.GamesCachePath, steamid.ToString()));
            return true;
        }


        /// <param name="accounts">list of accounts to update</param>
        /// <param name="processingCallback">Args: Current account, Remaining accounts count, Completed successfully </param>
        internal static async Task<EParseResult> ParseInfo(IList<Account> accounts,CancellationToken cancelToken, Action<Account,int> processingCallback = null)
        {
            if (accounts == null || accounts.Count == 0)
                return EParseResult.NoValidAccounts;

            var valid = accounts.Where(o => o.SteamID64 != null).ToDictionary(o => o.SteamID64.Value);
            var remaining = valid.Count;

            if (!valid.Any())
                return EParseResult.NoAccountsWithID;

            processingCallback?.Invoke(null, remaining);

            using (var request = new HttpRequestMessage(HttpMethod.Post, "https://localhost:7043/SteamService/PlayerSummaries/Stream?includeGames=true")
            {
                Content = new StringContent($"[ {string.Join(",", valid.Select(o => o.Value.SteamID64.Value))} ]", Encoding.UTF8, "application/json")
            })
            {
                var response = await App.WebBrowser.SendRequestAsync(request, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
                using (var stream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false))
                using(var reader = new StreamReader(stream))
                {
                    while (await reader.ReadLineAsync().ConfigureAwait(false) is string jObject)
                    {
                       var summaries = JsonConvert.DeserializeObject<PlayerSummaries>(jObject);
                       var account = valid[summaries.SteamId];
                       account.SetSummaries(summaries);
                       processingCallback?.Invoke(account, --remaining);
                    }
                }

            }
            
            


            return  EParseResult.OK;
        }

        internal static async Task<EParseResult> GetInfo(Account account)
        {
            if (account.SteamID64 == null)
                return EParseResult.NoAccountsWithID;

            var response = await App.WebBrowser.GetStringAsync($"https://steamapi.kitbyte.pp.ua/SteamService/PlayerSummaries?steamid={account.SteamID64}&includeGames=true");
            
            if(response == null)
            {
                App.Logger.Value.LogGenericDebug("Response is null, status code: " + App.WebBrowser.LastStatusCode);
            }
            else if(account.SetSummaries(JsonConvert.DeserializeObject<PlayerSummaries>(response)))
            {
                return EParseResult.OK;
            }

            return EParseResult.InternalError;
        }

        internal static async Task<bool> ParseGames(Account acc, bool withDetails = true)
        {
            return true;
        }

        internal static async Task<bool> ParseFriends(Account acc)
        {
            return true;
        }

    }
}
