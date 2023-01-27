using Newtonsoft.Json;
using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.Parsers
{

    internal sealed class SteamParser
    {

        private readonly string _apiKey = Keys.STEAM_API_KEY;
        private readonly ulong _steamId64;


        #region Summaries properties
        public string Nickname { get; private set; }
        public string ProfileURL { get; private set; }
        public string AvatarHash { get; private set; }
        public string CreatedDateImageUrl { get; private set; }
        public DateTime CreatedDateTime { get; private set; }
        public bool IsProfilePublic { get; private set; }
        public int? SteamLevel { get; private set; } 
        #endregion

        #region Games properties
        public int? HoursOnPlayed { get; private set; }
        public int? GamesPlayedCount { get; private set; }
        public int? TotalGamesCount { get; private set; }
        public string CountGamesImageUrl { get; private set; } 
        #endregion

        #region Bans properties
        public int VacBansCount { get; private set; }
        public bool CommunityBanned { get; private set; }
        public bool EconomyBanned { get; private set; }
        public int DaysSinceLastBan { get; private set; }
        public int GameBansCount { get; private set; } 
        #endregion


        public SteamParser(ulong steamId64)
        {
            _steamId64 = steamId64;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                _apiKey = Config.Properties.WebApiKey;
        }


        public async Task Parse()
        {

            //Получаем инфу о банах
            await ParseVacsAsync().ConfigureAwait(false);

            //Получаем общую инфу об аккаунте
            await ParsePlayerSummaries().ConfigureAwait(false);

            //Получаем инфу об количестве игр, уровне и наигранных часах
            await ParseGamesInfo().ConfigureAwait(false);

            // Получаем инфу о уровне
            await ParseSteamLevelAsync().ConfigureAwait(false);

        }


        #region Player games
        private string GetPlayerGamesOwnedLink() => $"http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={_apiKey}&steamid={_steamId64}&include_played_free_games=1&format=json";
        private async Task ParseGamesInfo()
        {
            if (!IsProfilePublic)
            {
                CountGamesImageUrl = "/Images/Games_count_badges/unknown.png";
                return;
            }

            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(GetPlayerGamesOwnedLink());
            var list = JsonConvert.DeserializeObject<RootObjectOwnedGames>(json);

            if (list.Response.Games == null)
            {
                CountGamesImageUrl = "/Images/Games_count_badges/unknown.png";
                return;
            }

            TotalGamesCount = list.Response.Game_count;

            #region Определение иконки в диапазоне количества игр
            ushort[] gameImageVariableArr = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000
             };
            int countGames = list.Response.Game_count;

            for (int i = 0; i < gameImageVariableArr.Length; i++)
            {
                if (i == gameImageVariableArr.Length) CountGamesImageUrl = "/Images/Games_count_badges/28000.png";
                else if (countGames > gameImageVariableArr[gameImageVariableArr.Length - 1])
                {
                    CountGamesImageUrl = "/Images/Games_count_badges/28000.png";
                    break;
                }
                else if (countGames == gameImageVariableArr[i] || countGames < gameImageVariableArr[i + 1])
                {
                    CountGamesImageUrl = $"/Images/Games_count_badges/{gameImageVariableArr[i]}.png";
                    break;
                }
            }
            #endregion

            int totalHours = 0, totalGamesPlayed = 0;
            Array.ForEach(list.Response.Games, o =>
            {
                if (o.Playtime_forever != 0)
                {
                    totalHours += (o.Playtime_forever / 60);
                    totalGamesPlayed++;
                }
            });

            GamesPlayedCount = totalGamesPlayed;
            HoursOnPlayed    = totalHours;
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
            public int Playtime_forever { get; set; }
        } 
        #endregion

        #region Player level
        private string GetSteamLevelLink() => $"http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key={_apiKey}&steamid={_steamId64}";

        private async Task ParseSteamLevelAsync()
        {
            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                string json = await webClient.DownloadStringTaskAsync(GetSteamLevelLink());
                var list    = JsonConvert.DeserializeObject<RootObjectPlayerLevel>(json);
                SteamLevel  = list.Response.Player_level;
            }
        }

        private class RootObjectPlayerLevel
        {
            public ResponsePlayerLevel Response { get; set; }
        }

        private class ResponsePlayerLevel
        {
            public int? Player_level { get; set; }
        }
        #endregion

        #region Player summaries

        private string GetPlayerSummariesLink() => $"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={_apiKey}&steamids={_steamId64}";

        public async Task ParsePlayerSummaries()
        {
            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                string json     = await webClient.DownloadStringTaskAsync(GetPlayerSummariesLink());
                var list        = JsonConvert.DeserializeObject<RootObjectPlayerSummaries>(json);
                Nickname        = list.Response.Players[0].Personaname;
                IsProfilePublic = list.Response.Players[0].CommunityVisibilityState == 3;
                ProfileURL      = list.Response.Players[0].Profileurl;
                AvatarHash      = list.Response.Players[0].AvatarHash;

                if (list.Response.Players[0].TimeCreated != 0)
                {
                    CreatedDateTime = (DateTime)Utils.Common.UnixTimeToDateTime(list.Response.Players[0].TimeCreated);

                    //Узнаем выслугу лет
                    var differ = DateTime.Now - CreatedDateTime;
                    CreatedDateImageUrl = $"/Images/Steam_years_of_service/year{(int)differ.TotalDays / 365}.png";
                }
                else
                {
                    CreatedDateImageUrl = $"/Images/Steam_years_of_service/year0.png";
                }
            }

        }


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
            public ulong TimeCreated { get; set; }
            public int CommunityVisibilityState { get; set; }
        }
        #endregion

        #region Player bans

        private string GetPlayerBansLink() => $"http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key={_apiKey}&steamids={_steamId64}";

        private async Task ParseVacsAsync()
        {
            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                string json      = await webClient.DownloadStringTaskAsync(GetPlayerBansLink());
                var list         = JsonConvert.DeserializeObject<RootObjectBansInfo>(json);
                VacBansCount     = list.Players[0].NumberOfVacBans;
                CommunityBanned  = list.Players[0].CommunityBanned;
                GameBansCount    = list.Players[0].NumberOfGameBans;
                EconomyBanned    = list.Players[0].EconomyBan != "none";
                DaysSinceLastBan = list.Players[0].DaysSinceLastBan;
            }
        }

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
            public int DaysSinceLastBan { get; set; }
        }
        #endregion
    }

}