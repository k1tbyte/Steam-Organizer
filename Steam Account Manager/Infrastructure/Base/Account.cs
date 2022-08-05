using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Steam_Account_Manager.Infrastructure.Parsers;

namespace Steam_Account_Manager.Infrastructure.Base
{
    [Serializable]
    internal class Account
    {
        public string login { get; set; }
        public string password { get; set; }
        public string nickname { get; set; }
        public ulong steamID64 { get; set; }
        public string avatarFull { get; set; }
        public uint steamLevel { get; set; }
        public uint purchasedGamesCount { get; set; }
        public int vacBansCount { get; set; }
        public DateTime accCreatedDate { get; set; }

        public Account(string login,
            string password, string nickname,
            ulong steamID64, string avatarFull,
            uint steamLevel, uint purchasedGamesCount,
            int vacBansCount, DateTime accCreatedDate)
        {
            this.login = login;
            this.password = password;
            this.nickname = nickname;
            this.steamID64 = steamID64;
            this.avatarFull = avatarFull;
            this.steamLevel = steamLevel;
            this.purchasedGamesCount = purchasedGamesCount;
            this.vacBansCount = vacBansCount;
            this.accCreatedDate = accCreatedDate;
        }

        public Account(string login, string password, ulong steamID64)
        {
            this.login = login;
            this.password = password;
            this.steamID64 = steamID64;
            SteamParser steamParser = new SteamParser(steamID64);
            steamParser.AccountParse();
            this.nickname = steamParser.GetNickname();
            this.avatarFull = steamParser.GetSteamPicture();
            this.steamLevel = steamParser.GetSteamLevel();
            this.purchasedGamesCount = steamParser.GetOwnedGamesCount();
            this.vacBansCount = steamParser.GetVacCount();
            this.accCreatedDate = steamParser.GetAccCreatedDate();
        }
    }
}
