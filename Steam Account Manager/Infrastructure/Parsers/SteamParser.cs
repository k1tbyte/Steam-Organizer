using System.Threading.Tasks;
using System;
using HtmlAgilityPack;
using System.Net;
using System.Text;
using Newtonsoft.Json;
using System.Net.Http;

namespace Steam_Account_Manager.Infrastructure.Parsers
{


    internal class SteamParser
    {
        private const string _apiKey = "55BB053C506F844D66D88D44F5598EC5";
        private readonly string _steamId64;

        //Player bans
        private uint _numberOfVacBans, _daysSinceLastBan;
        private bool _economyBan, _communityBan;

        //Player Summaries
        private string _nickname, _customProfileUrl, _avatarUrlFull, _createdDateImageUrl;
        private bool _profileVisiblity;
        private DateTime _accountCreatedDate;

        //Player Games data info
        private string _totalGames = "-", _gamesPlayed = "-";
        private string _steamLevel = "-", _hoursOnPlayed = "-";
        private string _countGamesImageUrl;


        public SteamParser(string steamId64)
        {
            _steamId64 = steamId64;
        }


        private async Task Tryparse()
        {

            //Получаем инфу о банах
            await ParseVacsAsync();

            //Получаем общую инфу об аккаунте
            await ParsePlayerSummariesAsync();

            //Получаем инфу об количестве игр, уровне и наигранных часах
            ParseGamesInfo();

            // Получаем инфу о уровне
            await ParseSteamLevelAsync();

        }

        public void AccountParse()
        {

            Tryparse().GetAwaiter().GetResult();

        }

        public string GetCreatedDateImageUrl => _createdDateImageUrl;
        public string GetCountGamesImageUrl => _countGamesImageUrl;
        public string GetSteamLevel => _steamLevel;
        public string GetHoursOnPlayed => _hoursOnPlayed;
        public string GetGamesPlayed => _gamesPlayed;
        public string GetTotalGames => _totalGames;


        private void ParseGamesInfo()
        {
            var url = new Uri($"https://steamdb.info/calculator/{_steamId64}/");
            var handler = new HttpClientHandler();
            var client = new HttpClient(handler);
            client.DefaultRequestHeaders.Add("accept", "text/javascript, text/html, application/xml, text/xml, */*");
            client.DefaultRequestHeaders.Add("Referer", "https://csgo-stats.com/");
            client.DefaultRequestHeaders.Add("user-agent", "Mozilla/5.0 (Linux; U; Android 4.1.1; en-us; Google Nexus 4 - 4.1.1 - API 16 - 768x1280 Build/JRO03S) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30");
            try
            {
                var response = client.GetAsync(url).Result;
                var html = response.Content.ReadAsStringAsync().Result;
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(html);

                var steam_games_info = htmlDoc.DocumentNode.SelectNodes("//span[@class='flex-grow'] | //div[@class='span3']");
               
                _totalGames = steam_games_info[0].InnerText.Split(' ', '\n')[4];

                //Если спарсился мусор - выход
                float.Parse(_totalGames);

                #region Определение иконки в диапазоне количества игр
                ushort[] gameImageVariableArr = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000
             };
                try
                {
                    int countGames = int.Parse(_totalGames.Replace(",", String.Empty));

                    for (int i = 0; i < gameImageVariableArr.Length; i++)
                    {
                        if (i == gameImageVariableArr.Length) _countGamesImageUrl = "/Images/Games_count_badges/28000.png";
                        else if (countGames > gameImageVariableArr[gameImageVariableArr.Length-1])
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
                }
                catch
                {
                    _countGamesImageUrl = "/Images/Games_count_badges/unknown.png";
                } 
                #endregion

                _gamesPlayed = steam_games_info[0].InnerText.Split(' ', '\n')[1];
                _hoursOnPlayed = steam_games_info[2].InnerText.Split(' ', '\n')[4].TrimEnd('h');


            }
            catch 
            {
                _totalGames = "-";
                _profileVisiblity = false;
                _countGamesImageUrl = "/Images/Games_count_badges/unknown.png";
            }
            handler.Dispose();
            client.Dispose();
        }



        #region Player level
        private string GetSteamLevelLink() =>
     "http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=" + _apiKey + "&steamid=" + _steamId64;

        private async Task ParseSteamLevelAsync()
        {
            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(GetSteamLevelLink());
            var list = JsonConvert.DeserializeObject<RootObjectPlayerLevel>(json);
            _steamLevel = list.Response.Player_level;
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

        private async Task ParsePlayerSummariesAsync()
        {
            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(GetPlayerSummariesLink());
            var list = JsonConvert.DeserializeObject<RootObjectPlayerSummaries>(json);
            _nickname = list.Response.Players[0].Personaname;
            _profileVisiblity = true;
            _customProfileUrl = list.Response.Players[0].Profileurl;
            _avatarUrlFull = list.Response.Players[0].AvatarFull;
            _accountCreatedDate = Utilities.UnixTimeToDateTime(list.Response.Players[0].TimeCreated);

            //Узнаем выслугу лет
            var differ = DateTime.Now - _accountCreatedDate;
            _createdDateImageUrl = $"/Images/Steam_years_of_service/year{(int)differ.TotalDays/365}.png";
        }

        public string GetNickname => _nickname;
        public bool GetProfileVisiblity => _profileVisiblity;
        public string GetCustomProfileUrl => _customProfileUrl;
        public string GetAvatarUrlFull => _avatarUrlFull;
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
            public string AvatarFull { get; set; }
            public long TimeCreated { get; set; }
        }
        #endregion

        #region Bans parse

        private string GetPlayerBansLink() =>
            "http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=" + _apiKey + "&steamids=" + _steamId64;


        private async Task ParseVacsAsync()
        {
            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(GetPlayerBansLink());
            var list = JsonConvert.DeserializeObject<RootObjectBansInfo>(json);
            _numberOfVacBans = uint.Parse(list.Players[0].NumberOfVacBans);
            _communityBan = list.Players[0].CommunityBanned;
            _economyBan = list.Players[0].EconomyBan != "none";
            _daysSinceLastBan = list.Players[0].DaysSinceLastBan;
        }


        public bool GetCommunityBanStatus => _communityBan;
        public bool GetEconomyBanStatus => _economyBan;
        public uint GetVacCount => _numberOfVacBans;
        public uint GetDaysSinceLastBan => _daysSinceLastBan;


        private class RootObjectBansInfo
        {
            public PlayerBans[] Players { get; set; }
        }

        private class PlayerBans
        {
            public string NumberOfVacBans { get; set; }
            public bool CommunityBanned { get; set; }
            public string EconomyBan { get; set; }
            public uint DaysSinceLastBan { get; set; }
        }
        #endregion
    }

}