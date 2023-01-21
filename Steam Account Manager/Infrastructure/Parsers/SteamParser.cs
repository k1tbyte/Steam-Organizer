using HtmlAgilityPack;
using Newtonsoft.Json;
using System;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.Parsers
{

    internal sealed class SteamParser
    {

        private string _apiKey = Keys.STEAM_API_KEY;

        private readonly string _steamId64;

        //Player bans
        private int _numberOfVacBans,_numberOfGameBans;
        private uint _daysSinceLastBan;
        private bool _economyBan, _communityBan;

        //Player Summaries
        private string _nickname, _customProfileUrl, _avatarHash, _createdDateImageUrl;
        private bool _profileVisiblity;
        private DateTime _accountCreatedDate;

        //Player Games data info
        private string _totalGames = "-", _gamesPlayed = "-";
        private string _steamLevel = "-", _hoursOnPlayed = "-";
        private string _countGamesImageUrl;


        public SteamParser(string steamId64)
        {
            _steamId64 = steamId64;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                _apiKey = Config.Properties.WebApiKey;
        }


        public async Task AccountParse()
        {

            //Получаем инфу о банах
            await ParseVacsAsync();

            //Получаем общую инфу об аккаунте
            ParsePlayerSummaries();

            //Получаем инфу об количестве игр, уровне и наигранных часах
            await ParseGamesInfo();

            // Получаем инфу о уровне
            await ParseSteamLevelAsync();

        }



        public string GetCreatedDateImageUrl => _createdDateImageUrl;
        public string GetCountGamesImageUrl => _countGamesImageUrl;
        public string GetSteamLevel => _steamLevel;
        public string GetHoursOnPlayed => _hoursOnPlayed;
        public string GetGamesPlayed => _gamesPlayed;
        public string GetTotalGames => _totalGames;


        private string GetPlayerGamesOwnedLink() =>
    "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + _apiKey + "&steamid=" + _steamId64 + "&include_played_free_games=1&format=json";
        private async Task ParseGamesInfo()
        {
            if (!_profileVisiblity)
            {
                _totalGames = "-";
                _countGamesImageUrl = "/Images/Games_count_badges/unknown.png";
                return;
            }

            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(GetPlayerGamesOwnedLink());
            var list = JsonConvert.DeserializeObject<RootObjectOwnedGames>(json);

            if (list.Response.Games == null)
            {
                _totalGames = "-";
                _countGamesImageUrl = "/Images/Games_count_badges/unknown.png";
                return;
            }

            _totalGames = list.Response.Game_count.ToString();

            #region Определение иконки в диапазоне количества игр
            ushort[] gameImageVariableArr = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000
             };
            int countGames = list.Response.Game_count;

            for (int i = 0; i < gameImageVariableArr.Length; i++)
            {
                if (i == gameImageVariableArr.Length) _countGamesImageUrl = "/Images/Games_count_badges/28000.png";
                else if (countGames > gameImageVariableArr[gameImageVariableArr.Length - 1])
                {
                    _countGamesImageUrl = "/Images/Games_count_badges/28000.png";
                    break;
                }
                else if (countGames == gameImageVariableArr[i] || countGames < gameImageVariableArr[i + 1])
                {
                    _countGamesImageUrl = $"/Images/Games_count_badges/{gameImageVariableArr[i]}.png";
                    break;
                }
            }
            #endregion

            ulong totalHours = 0;
            int totalGamesPlayed = 0;
            Array.ForEach(list.Response.Games, o =>
            {
                if (o.Playtime_forever != 0)
                {
                    totalHours += (o.Playtime_forever / 60);
                    totalGamesPlayed++;
                }
            });

            _gamesPlayed = totalGamesPlayed.ToString();
            _hoursOnPlayed = totalHours.ToString("#,#", CultureInfo.InvariantCulture);
        }

        private class RootObjectOwnedGames
        {
            public ResponsePlayerGame Response { get; set; }
        }

        private class ResponsePlayerGame
        {
            public int Game_count { get; set; }
            public PlayerGame[] Games { get; set; }
        }

        private class PlayerGame
        {
            public ulong Playtime_forever { get; set; }
        }

        #region Player level
        private string GetSteamLevelLink() =>
     "http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=" + _apiKey + "&steamid=" + _steamId64;

        private async Task ParseSteamLevelAsync()
        {
            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                string json = await webClient.DownloadStringTaskAsync(GetSteamLevelLink());
                var list = JsonConvert.DeserializeObject<RootObjectPlayerLevel>(json);
                _steamLevel = list.Response.Player_level != null ? list.Response.Player_level : "-";
            }
        }

        private class RootObjectPlayerLevel
        {
            public ResponsePlayerLevel Response { get; set; }
        }

        private class ResponsePlayerLevel
        {
            public string Player_level { get; set; }
        }
        #endregion

        #region Player summaries

        private string GetPlayerSummariesLink() =>
            "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + _apiKey + "&steamids=" + _steamId64;

        public void ParsePlayerSummaries()
        {
            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                string json = webClient.DownloadString(new Uri(GetPlayerSummariesLink()));
                var list = JsonConvert.DeserializeObject<RootObjectPlayerSummaries>(json);
                _nickname = list.Response.Players[0].Personaname;
                _profileVisiblity = list.Response.Players[0].CommunityVisibilityState == 3;
                _customProfileUrl = list.Response.Players[0].Profileurl;
                _avatarHash = list.Response.Players[0].AvatarHash;
                if (list.Response.Players[0].TimeCreated != 0)
                {
                    _accountCreatedDate = (DateTime)Utilities.UnixTimeToDateTime(list.Response.Players[0].TimeCreated);

                    //Узнаем выслугу лет
                    var differ = DateTime.Now - _accountCreatedDate;
                    _createdDateImageUrl = $"/Images/Steam_years_of_service/year{(int)differ.TotalDays / 365}.png";
                }
                else
                {
                    _createdDateImageUrl = $"/Images/Steam_years_of_service/year0.png";
                }
            }

        }

        public string GetNickname => _nickname;
        public bool GetProfileVisiblity => _profileVisiblity;
        public string GetCustomProfileUrl => _customProfileUrl;
        public string GetAvatarHash => _avatarHash;
        public DateTime GetAccountCreatedDate => _accountCreatedDate;


        private class RootObjectPlayerSummaries
        {
            public ResponsePlayerSummaries Response { get; set; }
        }

        private class ResponsePlayerSummaries
        {
            public PlayerSummaries[] Players { get; set; }
        }

        private class PlayerSummaries
        {
            public string Personaname { get; set; }
            public string Profileurl { get; set; }
            public string AvatarHash { get; set; }
            public string AvatarMedium { get; set; }
            public long TimeCreated { get; set; }
            public int CommunityVisibilityState { get; set; }
        }
        #endregion

        #region Bans parse

        private string GetPlayerBansLink() =>
            "http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=" + _apiKey + "&steamids=" + _steamId64;


        private async Task ParseVacsAsync()
        {
            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                string json = await webClient.DownloadStringTaskAsync(GetPlayerBansLink());
                var list = JsonConvert.DeserializeObject<RootObjectBansInfo>(json);
                _numberOfVacBans = list.Players[0].NumberOfVacBans;
                _communityBan = list.Players[0].CommunityBanned;
                _numberOfGameBans = list.Players[0].NumberOfGameBans;
                _economyBan = list.Players[0].EconomyBan != "none";
                _daysSinceLastBan = list.Players[0].DaysSinceLastBan;
            }

        }


        public bool GetCommunityBanStatus => _communityBan;
        public bool GetEconomyBanStatus => _economyBan;
        public int GetVacCount => _numberOfVacBans;
        public int GetGameBansCount => _numberOfGameBans;
        public uint GetDaysSinceLastBan => _daysSinceLastBan;


        private class RootObjectBansInfo
        {
            public PlayerBans[] Players { get; set; }
        }

        private class PlayerBans
        {
            public int NumberOfVacBans { get; set; }
            public int NumberOfGameBans { get; set; }
            public bool CommunityBanned { get; set; }
            public string EconomyBan { get; set; }
            public uint DaysSinceLastBan { get; set; }
        }
        #endregion
    }

}