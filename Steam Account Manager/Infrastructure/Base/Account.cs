using Steam_Account_Manager.Infrastructure.Parsers;
using System;

namespace Steam_Account_Manager.Infrastructure.Base
{
    [Serializable]
    internal class Account
    {
        public string Login { get; set; }
        public string Password { get; set; }
        public string Nickname { get; set; }
        public ulong SteamId64 { get; set; }
        public string AvatarFull { get; set; }
        public uint SteamLevel { get; set; }
        public uint PurchasedGamesCount { get; set; }
        public int VacBansCount { get; set; }
        public DateTime AccCreatedDate { get; set; }

        public Account(string login,
            string password, string nickname,
            ulong steamId64, string avatarFull,
            uint steamLevel, uint purchasedGamesCount,
            int vacBansCount, DateTime accCreatedDate)
        {
            this.Login = login;
            this.Password = password;
            this.Nickname = nickname;
            this.SteamId64 = steamId64;
            this.AvatarFull = avatarFull;
            this.SteamLevel = steamLevel;
            this.PurchasedGamesCount = purchasedGamesCount;
            this.VacBansCount = vacBansCount;
            this.AccCreatedDate = accCreatedDate;
        }

        public Account(string login, string password, ulong steamId64)
        {
            this.Login = login;
            this.Password = password;
            this.SteamId64 = steamId64;
            var steamParser = new SteamParser(steamId64);
            steamParser.AccountParse();
            this.Nickname = steamParser.GetNickname();
            this.AvatarFull = steamParser.GetSteamPicture();
            this.SteamLevel = steamParser.GetSteamLevel();
            this.PurchasedGamesCount = steamParser.GetOwnedGamesCount();
            this.VacBansCount = steamParser.GetVacCount();
            this.AccCreatedDate = steamParser.GetAccCreatedDate();
        }
    }
}
