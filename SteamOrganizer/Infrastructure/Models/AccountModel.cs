using Newtonsoft.Json;
using SteamOrganizer.Infrastructure.Converters;
using SteamOrganizer.Infrastructure.Parsers;
using SteamOrganizer.Utils;
using System;
using System.Threading.Tasks;

namespace SteamOrganizer.Infrastructure.Models
{
    [Serializable]
    internal sealed class CSGOStats
    {
        //ranks 5x5
        private string _currentRank, _bestRank;
        public float? Accuracy { get; set; }
        public float? HeadshotPercent { get; set; }
        public float? Winrate { get; set; }
        public float? KD { get; set; }
        public int? RoundsPlayed { get; set; }
        public int? PlayedMatches { get; set; }
        public int? MatchesWon { get; set; }
        public int? Headshots { get; set; }
        public int? ShotsHit { get; set; }
        public int? TotalShots { get; set; }
        public int? Kills { get; set; }
        public int? Deaths { get; set; }

        public string CurrentRank
        {
            get => $"/Images/Ranks/CSGO/{_currentRank ?? "skillgroup_none"}.png";
            set => _currentRank = value;
        }

        public string BestRank
        {
            get => $"/Images/Ranks/CSGO/{_bestRank ?? "skillgroup_none"}.png";
            set => _bestRank = value;
        }
    }

    [Serializable]
    internal sealed class Account
    {
        #region Properties

        #region Summaries properties
        public ulong? SteamId64 { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public string Nickname { get; set; }
        public string AvatarHash { get; set; }
        public string ProfileURL { get; set; }
        public bool IsProfilePublic { get; set; }
        public DateTime AccCreatedDate { get; set; }

        [JsonIgnore]
        public string CreatedDateImageUrl { get; set; }

        [JsonIgnore]
        public bool ContainParseInfo { get; set; }

        [JsonProperty("LastUpdateDate")]
        public DateTime LastUpdateTime { get; set; }

        [JsonIgnore]
        public UInt32? SteamId32     => SteamIDConverter.SteamID64To32(SteamId64);
       
        [JsonIgnore]
        public string SteamID        => SteamIDConverter.SteamID64ToSteamID(SteamId64);
       
        [JsonIgnore]
        public string SteamID3       => SteamIDConverter.SteamID64ToSteamID3(SteamId64);
       
        [JsonIgnore]
        public string FiveM          => SteamIDConverter.SteamID64ToFiveM(SteamId64);
      
        [JsonIgnore]
        public string CsgoFriendCode => SteamIDConverter.SteamID64ToCsgoFriendCode(SteamId64);
       
        [JsonIgnore]
        public string AvatarFull     => ContainParseInfo ? $"https://avatars.akamai.steamstatic.com/{AvatarHash}_full.jpg" : "/Images/default_steam_profile.png";
        
        [JsonIgnore] 
        public string AvatarMedium   => ContainParseInfo ? $"https://avatars.akamai.steamstatic.com/{AvatarHash}_medium.jpg" : "/Images/default_steam_profile.png";

        [field: NonSerialized]
        [JsonIgnore]
        public int Index { get; set; }
        #endregion

        #region Bans properties
        public bool EconomyBanned { get; set; }
        public bool CommunityBanned { get; set; }
        public int VacBansCount { get; set; }
        public int GameBansCount { get; set; }
        public int DaysSinceLastBan { get; set; }
        #endregion

        #region Games properties
        public int? SteamLevel { get; set; }
        public int? TotalGamesCount { get; set; }
        public int? GamesPlayedCount { get; set; }
        public int? HoursOnPlayed { get; set; }
        public string CountGamesImageUrl { get; set; }

        [JsonIgnore]
        public CSGOStats CSGOStats { get; set; }
        #endregion

        #region Other info properties
        public string Note { get; set; } = "";

        [JsonProperty("SteamEmail")]
        public string EmailLogin { get; set; }

        [JsonProperty("SteamEmailPassword ")]
        public string EmailPass { get; set; }

        [JsonProperty("RockstarEmail")]
        public string RockstarEmail { get; set; }

        [JsonProperty("RockstarPassword")]
        public string RockstarPass { get; set; }

        [JsonProperty("UbisoftEmail")]
        public string UplayEmail { get; set; }

        [JsonProperty("UbisoftPassword")]
        public string UplayPass { get; set; }
        public string OriginEmail { get; set; }
        public string OriginPass { get; set; }

        [JsonProperty("EpicGamesEmail")]
        public string EpicGamesEmail { get; set; }

        [JsonProperty("EpicGamesPassword")]
        public string EpicGamesPass { get; set; }
        public string AuthenticatorPath { get; set; }
        #endregion

        #endregion

        public Account() { }

        //Default
        public Account(string login, string password, ulong steamId64)
        {
            this.Login     = login;
            this.Password  = password;
            this.SteamId64 = steamId64;
            this.CSGOStats = new CSGOStats();            
        }

        public async Task<bool> ParseInfo()
        {
            if (!SteamId64.HasValue)
                return false;

            SteamParser steamParser = new SteamParser(SteamId64.Value);
            await steamParser.Parse().ConfigureAwait(false);

            this.Nickname            = steamParser.Nickname;
            this.AvatarHash          = steamParser.AvatarHash;
            this.ProfileURL          = steamParser.ProfileURL;
            this.IsProfilePublic     = steamParser.IsProfilePublic;
            this.AccCreatedDate      = steamParser.CreatedDateTime;
            this.CreatedDateImageUrl = steamParser.CreatedDateImageUrl;
            this.LastUpdateTime      = DateTime.Now;

            this.EconomyBanned    = steamParser.EconomyBanned;
            this.CommunityBanned  = steamParser.CommunityBanned;
            this.VacBansCount     = steamParser.VacBansCount;
            this.GameBansCount    = steamParser.GameBansCount;
            this.DaysSinceLastBan = steamParser.DaysSinceLastBan;

            this.SteamLevel         = steamParser.SteamLevel;
            this.TotalGamesCount    = steamParser.TotalGamesCount;
            this.GamesPlayedCount   = steamParser.GamesPlayedCount;
            this.HoursOnPlayed      = steamParser.HoursOnPlayed;
            this.CountGamesImageUrl = steamParser.CountGamesImageUrl;
            this.ContainParseInfo   = true;

            var trayAcc = Config.Properties.RecentlyLoggedUsers.Find(o => o.SteamID64 == SteamId64);
            if (trayAcc != default(RecentlyLoggedUser) && trayAcc.Nickname != Nickname)
                trayAcc.Nickname = Nickname;

            return true;
        }

        public Account(string login, string password, string nickname)
        {
            this.ContainParseInfo = false;

            this.Login = login;
            this.Password = password;
            this.Nickname = nickname;
            this.LastUpdateTime = DateTime.Now;
        }

        public override string ToString()
        {
            return $"{Nickname} [{SteamId32}]";
        }
    }
}
