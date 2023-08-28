using Newtonsoft.Json;
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
using System.Windows.Media.Imaging;

namespace SteamOrganizer.Infrastructure.Steam
{
    internal static class API
    {
        internal enum EAPIResult : byte
        {
            OK,
            NoValidAccounts,
            NoAccountsWithID,
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
        private sealed class PlayerSummaries
        {
            internal sealed class PlayerBans
            {
                public bool CommunityBanned;
                public int NumberOfVacBans;
                public int NumberOfGameBans;
                public int DaysSinceLastBan;
                public EconomyBanType EconomyBan;
            }

            public ulong                SteamId;
            public string               AvatarHash;
            public string               PersonaName;
            public string               ProfileURL;
            public string               LocCountryCode;
            public DateTime?            TimeCreated;
            public byte                 CommunityVisibilityState;
            public byte                 CommentPermission;
            public int?                 SteamLevel;
            public PlayerBans           Bans;
            public PlayerGamesSummaries GamesSummaries;
        }

        #endregion

        #region Games
        private class PlayerGamesSummaries
        {
            public Game[] Games;
            public int PlayedGamesCount;
            public float HoursOnPlayed;
            public ushort GamesBoundaryBadge;
            public string GamesPriceFormatted;
            public int PaidGames;
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

        [Serializable]
        internal class Friend
        {
            public ulong SteamID { get; set; }
            public string Avatarhash { get; set; }
            public string PersonaName { get; set; }
            public DateTime? Friend_since { get; set; }

            [JsonIgnore]
            public BitmapImage BitmapSource => CachingManager.GetCachedAvatar(Avatarhash);

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
        internal static async Task<EAPIResult> GetInfo(IList<Account> accounts,CancellationToken cancelToken, Action<Account,int> processingCallback = null)
        {
            if (accounts == null || accounts.Count == 0)
                return EAPIResult.NoValidAccounts;

            var valid = accounts.Where(o => o.SteamID64 != null).ToDictionary(o => o.SteamID64.Value);
            var remaining = valid.Count;

            if (!valid.Any())
                return EAPIResult.NoAccountsWithID;

            processingCallback?.Invoke(null, remaining);

            using (var request = new HttpRequestMessage(HttpMethod.Post, "https://steamapi.kitbyte.pp.ua/SteamService/PlayerSummaries/Stream?includeGames=true")
            {
                Content = new StringContent($"[ {string.Join(",", valid.Select(o => o.Value.SteamID64.Value))} ]", Encoding.UTF8, "application/json")
            })
            {
                var response = await App.WebBrowser.SendRequestAsync(request, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);
                using (var stream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false))
                using(var reader = new StreamReader(stream))
                {
                    while (await reader.ReadLineAsync().ConfigureAwait(false) is string jObject && !cancelToken.IsCancellationRequested)
                    {
                       var summaries = JsonConvert.DeserializeObject<PlayerSummaries>(jObject);
                       var account = valid[summaries.SteamId];
                       account.SetSummaries(summaries);
                       processingCallback?.Invoke(account, --remaining);
                    }
                }

            }

            if (cancelToken.IsCancellationRequested)
                return EAPIResult.OperationCanceled;
            
            return  EAPIResult.OK;
        }

        internal static async Task<EAPIResult> GetInfo(Account account)
        {
            if (account.SteamID64 == null)
                return EAPIResult.NoAccountsWithID;

            if(account.SetSummaries(await App.WebBrowser.GetAsJsonAsync<PlayerSummaries>(
                $"https://steamapi.kitbyte.pp.ua/SteamService/PlayerSummaries?steamid={account.SteamID64}&includeGames=true")))
            {
                return EAPIResult.OK;
            }

            return EAPIResult.InternalError;
        }

        internal static async Task<bool> GetGames(Account acc)
        {
            if (acc.SteamID64 == null)
                return false;

            if(!acc.SetGames(await App.WebBrowser.GetAsJsonAsync<PlayerGamesSummaries>(
                $"https://steamapi.kitbyte.pp.ua/SteamService/PlayerOwnedGames?steamId={acc.SteamID64}&withDetails=true"),
                    acc.SteamID64.Value))
            {
                return false;
            }

            return true;
        }

        internal static async Task<bool> GetFriends(Account acc)
        {
            if (acc.SteamID64 == null)
                return false;

            var result = await App.WebBrowser.GetAsJsonAsync<Friend[]>(
                    $"https://steamapi.kitbyte.pp.ua/SteamService/PlayerFriendList?steamId={acc.SteamID64}");

            if (result == null)
                return false;

            if(result.Length > 0)
                FileCryptor.Serialize(result, Path.Combine(CachingManager.FriendsCachePath, acc.SteamID64.ToString()));

            return true;
        }

    }
}
