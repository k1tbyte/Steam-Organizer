using Steam_Account_Manager.Infrastructure.Parsers;
using Steam_Account_Manager.Infrastructure.GamesModels;
using System;

namespace Steam_Account_Manager.Infrastructure.Base
{
    [Serializable]
    internal class Account
    {

        //Player summaries
        public string SteamId64 { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public string Nickname { get; set; }
        public string AvatarFull { get; set; }
        public string ProfileURL { get; set; }
        public bool ProfileVisility { get; set; }
        public DateTime AccCreatedDate { get; set; }
        public string CreatedDateImageUrl { get; set; }


        //Player bans
        public bool TradeBan { get; set; }
        public bool CommunityBan { get; set; }
        public uint VacBansCount { get; set; }
        public uint DaysSinceLastBan { get; set; }


        //Player games
        public string SteamLevel { get; set; }
        public string TotalGames { get; set; }
        public string GamesPlayed { get; set; }
        public string HoursOnPlayed { get; set; }
        public string CountGamesImageUrl { get; set; }
        public CsgoStats CsgoStats { get; set; }

        public Account(string login,string password,string steamId64)
        {
            this.Login = login;
            this.Password = password;
            this.SteamId64 = steamId64;
            SteamParser steamParser = new SteamParser(steamId64);
            steamParser.AccountParse();
            this.Nickname = steamParser.GetNickname;
            this.AvatarFull = steamParser.GetAvatarUrlFull;
            this.ProfileURL = steamParser.GetCustomProfileUrl;
            this.ProfileVisility = steamParser.GetProfileVisiblity;
            this.AccCreatedDate = steamParser.GetAccountCreatedDate;

            this.TradeBan = steamParser.GetEconomyBanStatus;
            this.CommunityBan = steamParser.GetCommunityBanStatus;
            this.VacBansCount = steamParser.GetVacCount;
            this.DaysSinceLastBan = steamParser.GetDaysSinceLastBan;

            this.SteamLevel = steamParser.GetSteamLevel;
            this.TotalGames = steamParser.GetTotalGames;
            this.GamesPlayed = steamParser.GetGamesPlayed;
            this.HoursOnPlayed = steamParser.GetHoursOnPlayed;
            this.CountGamesImageUrl = steamParser.GetCountGamesImageUrl;
            this.CreatedDateImageUrl = steamParser.GetCreatedDateImageUrl;
            this.CsgoStats = new CsgoStats();
        }
    }
}
