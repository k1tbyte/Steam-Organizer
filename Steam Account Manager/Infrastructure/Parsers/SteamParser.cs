using SteamWebAPI2.Interfaces;
using System.Threading.Tasks;
using SteamWebAPI2.Utilities;
using System;
using System.Net;
using Newtonsoft.Json;

namespace Steam_Account_Manager.Infrastructure.Parsers
{
    class SteamParser
    {
        private static string APIKey = "55BB053C506F844D66D88D44F5598EC5";
        private ulong steamID64;
        private string nickname;
        private string avatarFull;
        private DateTime accCreatedDate;
        private int vacCount;
        private uint ownedGamesCount;
        private uint level;

        private string getPlayerBansString(string steamId)
        {
            return "http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key="
                + APIKey + "&steamids=" + steamId;
        }

        public async void parseVacsAsync()
        { 
            string apiString = getPlayerBansString(steamID64.ToString());
            var webClient = new WebClient { Encoding = System.Text.Encoding.UTF8 };
            var json = await webClient.DownloadStringTaskAsync(apiString);
            var list = JsonConvert.DeserializeObject<RootObjectVacInfo>(json);
            vacCount = Int32.Parse(list.players[0].NumberOfVACBans);
        }

        public SteamParser(ulong steamId64)
        {
            steamID64 = steamId64;
        }

        private async Task Tryparse()
        {
            var webInterfaceFactory = new SteamWebInterfaceFactory(APIKey);
            var steamProfileInterface = webInterfaceFactory.CreateSteamWebInterface<SteamUser>();

            //Получаем инфу о профиле
            var playerSummaryResponse = await steamProfileInterface.GetPlayerSummaryAsync(steamID64);
            var playerSummaryData = playerSummaryResponse.Data;

            //Получаем инфу о банах
            parseVacsAsync();

            //Получаем инфу об играх и уровне
            var steamPlayerInterface = webInterfaceFactory.CreateSteamWebInterface<PlayerService>();
            var profileLevel = await steamPlayerInterface.GetSteamLevelAsync(steamID64);
            var profileLevelData = profileLevel.Data;
            var ownedGames = await steamPlayerInterface.GetOwnedGamesAsync(steamID64);
            var ownedGamesData = profileLevel.Data;

            nickname = playerSummaryData.Nickname;
            avatarFull = playerSummaryData.AvatarFullUrl;
            accCreatedDate = playerSummaryData.AccountCreatedDate;
            level = profileLevelData.Value;
            ownedGamesCount = ownedGamesData.Value;


        }

        public void AccountParse()
        {
            Tryparse().GetAwaiter().GetResult();
        }


        public string GetNickname()
        {
            return this.nickname;
        }
        public string GetSteamPicture()
        {
            return this.avatarFull;
        }
        public int GetVacCount()
        {
            return this.vacCount;
        }
        public uint GetSteamLevel()
        {
            return level;
        }
        public uint GetOwnedGamesCount()
        {
            return ownedGamesCount;
        }



        public DateTime GetAccCreatedDate()
        {
            return accCreatedDate;
        }

        private class RootObjectVacInfo
        {
            public PlayerVacInfo[] players { get; set; }
        }
        private class PlayerVacInfo
        {
            public string NumberOfVACBans { get; set; }
        }
    }

}