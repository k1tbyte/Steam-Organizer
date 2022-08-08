using SteamWebAPI2.Interfaces;
using System.Threading.Tasks;
using SteamWebAPI2.Utilities;
using System;
using System.Net;
using System.Text;
using Newtonsoft.Json;

namespace Steam_Account_Manager.Infrastructure.Parsers
{
    class SteamParser
    {
        private const string _apiKey = "55BB053C506F844D66D88D44F5598EC5";
        private readonly ulong _steamId64;
        private string _nickname;
        private string _avatarFull;
        private DateTime _accCreatedDate;
        private int _vacCount;
        private uint _ownedGamesCount;
        private uint _level;

        private string GetPlayerBansString(string steamId)
        {
            return "http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key="
                + _apiKey + "&steamids=" + steamId;
        }

        public async void ParseVacsAsync()
        {
            var apiString = GetPlayerBansString(_steamId64.ToString());
            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            var json = await webClient.DownloadStringTaskAsync(apiString);
            var list = JsonConvert.DeserializeObject<RootObjectVacInfo>(json);
            _vacCount = int.Parse(list.Players[0].NumberOfVacBans);
        }

        public SteamParser(ulong steamId64)
        {
            _steamId64 = steamId64;
        }

        private async Task Tryparse()
        {
            var webInterfaceFactory = new SteamWebInterfaceFactory(_apiKey);
            var steamProfileInterface = webInterfaceFactory.CreateSteamWebInterface<SteamUser>();

            //Получаем инфу о профиле
            var playerSummaryResponse = await steamProfileInterface.GetPlayerSummaryAsync(_steamId64);
            var playerSummaryData = playerSummaryResponse.Data;

            //Получаем инфу о банах
            ParseVacsAsync();

            //Получаем инфу об играх и уровне
            var steamPlayerInterface = webInterfaceFactory.CreateSteamWebInterface<PlayerService>();
            var profileLevel = await steamPlayerInterface.GetSteamLevelAsync(_steamId64);
            var profileLevelData = profileLevel.Data;
           // var ownedGames = await steamPlayerInterface.GetOwnedGamesAsync(_steamId64);
            var ownedGamesData = profileLevel.Data;

            _nickname = playerSummaryData.Nickname;
            _avatarFull = playerSummaryData.AvatarFullUrl;
            _accCreatedDate = playerSummaryData.AccountCreatedDate;
            if (profileLevelData != null) _level = profileLevelData.Value;
            if (ownedGamesData != null) _ownedGamesCount = ownedGamesData.Value;
        }

        public void AccountParse()
        {
            Tryparse().GetAwaiter().GetResult();
        }


        public string GetNickname()
        {
            return this._nickname;
        }
        public string GetSteamPicture()
        {
            return this._avatarFull;
        }
        public int GetVacCount()
        {
            return this._vacCount;
        }
        public uint GetSteamLevel()
        {
            return _level;
        }
        public uint GetOwnedGamesCount()
        {
            return _ownedGamesCount;
        }


        public DateTime GetAccCreatedDate()
        {
            return _accCreatedDate;
        }

        private class RootObjectVacInfo
        {
            public PlayerVacInfo[] Players { get; set; }
        }

        private class PlayerVacInfo
        {
            public string NumberOfVacBans { get; set; }
        }
    }

}