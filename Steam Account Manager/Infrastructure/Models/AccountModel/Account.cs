using Steam_Account_Manager.Infrastructure.Parsers;
using System;
using System.Web.UI.WebControls;

namespace Steam_Account_Manager.Infrastructure.Models.AccountModel
{
    [Serializable]
    internal class Account
    {
        #region Properties
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
        public bool ContainParseInfo { get; set; }
        public DateTime LastUpdateTime { get; set; }


        //Player bans
        public bool TradeBan { get; set; }
        public bool CommunityBan { get; set; }
        public int VacBansCount { get; set; }
        public uint DaysSinceLastBan { get; set; }


        //Player games
        public string SteamLevel { get; set; }
        public string TotalGames { get; set; }
        public string GamesPlayed { get; set; }
        public string HoursOnPlayed { get; set; }
        public string CountGamesImageUrl { get; set; }
        public CSGO CsgoStats { get; set; }

        //Other info
        public string Note { get; set; }
        public string EmailLogin { get; set; }
        public string EmailPass { get; set; }
        public string RockstarEmail { get; set; }
        public string RockstarPass { get; set; }
        public string UplayEmail { get; set; }
        public string UplayPass { get; set; }
        public string OriginEmail { get; set; }
        public string OriginPass { get; set; }
        public string AuthenticatorPath { get; set; } 
        #endregion

        //Default
        public Account(string login, string password, string steamId64)
        {
            this.Login = login;
            this.Password = password;
            this.SteamId64 = steamId64;

            SteamParser steamParser = new SteamParser(steamId64);
            steamParser.AccountParse().GetAwaiter().GetResult();
            this.Nickname = steamParser.GetNickname;
            this.AvatarFull = steamParser.GetAvatarUrlFull;
            this.ProfileURL = steamParser.GetCustomProfileUrl;
            this.ProfileVisility = steamParser.GetProfileVisiblity;
            this.AccCreatedDate = steamParser.GetAccountCreatedDate;
            this.LastUpdateTime = DateTime.Now;

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
            this.ContainParseInfo = true;

            this.CsgoStats = new CSGO();

         //   this.Note = EmailLogin = EmailPass = RockstarEmail = RockstarPass = UplayEmail = UplayPass = OriginEmail = OriginPass = "";
        }

        //Update account counstructor
        public Account(string login, string password, string steamId64, string note, string emailLogin, string emailPass,
             string rockstarEmail, string rockstarPass, string uplayEmail, string uplayPass,
             string originEmail, string originPass, CSGO csgoStats, string authenticatorPath,string nick = null) : this(login,password,steamId64)
        {
            if (csgoStats != null)
                this.CsgoStats = csgoStats;

            this.AuthenticatorPath = authenticatorPath;

            this.Note = note;
            this.EmailLogin = emailLogin;
            this.EmailPass = emailPass;
            this.RockstarEmail = rockstarEmail;
            this.RockstarPass = rockstarPass;
            this.UplayEmail = uplayEmail;
            this.UplayPass = uplayPass;
            this.OriginPass = originPass;
            this.OriginEmail = originEmail;

            if(nick.GetHashCode() != this.Nickname.GetHashCode())
            {
                foreach (var item in Config.Properties.RecentlyLoggedUsers)
                {
                    if (item.SteamID64 == this.SteamId64 && item.Nickname != this.Nickname)
                    {
                        Config.Properties.RecentlyLoggedUsers[Config.Properties.RecentlyLoggedUsers.IndexOf(item)] = new RecentlyLoggedUser()
                        {
                            SteamID64 = item.SteamID64,
                            IsRewritable = item.IsRewritable,
                            Nickname = this.Nickname
                        };
                        App.Tray.TrayListUpdate();
                        Config.SaveProperties();
                        break;
                    }
                }
            }


        }

        public Account(string login, string password, string nickname, bool anonymAccount)
        {
            this.ContainParseInfo = false;

            this.Login = login;
            this.Password = password;
            this.Nickname = nickname;
            this.LastUpdateTime = DateTime.Now;
        }

        public override string ToString()
        {
            return $"{Nickname} [{Utilities.SteamId64ToSteamId32(SteamId64)}]";
        }
    }
}
