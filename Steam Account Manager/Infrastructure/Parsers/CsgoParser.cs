using Newtonsoft.Json.Linq;
using Steam_Account_Manager.Infrastructure.Models;
using System;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Steam_Account_Manager.Infrastructure.Parsers
{
    internal sealed class CsgoParser
    {

        private readonly string _apiKey = Keys.STEAM_API_KEY;

        private readonly ulong _steamId64;

        private static readonly string[] parseZones = {
            "total_kills","total_deaths","total_kills_headshot","total_shots_hit",
            "total_shots_fired","total_rounds_played","total_matches_won","total_matches_played" };

        public CsgoParser(ulong SteamId64)
        {
            _steamId64 = SteamId64;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                _apiKey = Config.Properties.WebApiKey;
        }

        public CSGOStats CSGOStats { get; private set; } = new CSGOStats();

        /// <summary>
        /// 
        /// 0. Kills
        /// 1. Deaths
        /// 2. Headshoots
        /// 3. Shots hit
        /// 4. Total shots
        /// 5. Rounds played
        /// 6. Total matches won
        /// 7. Played matches
        /// 
        /// </summary>
        public async Task<bool> GlobalStatsParse()
        {
            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = "";
            try
            {
                json = await webClient.DownloadStringTaskAsync(
    $"http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key={_apiKey}&steamid={_steamId64}");
            }
            catch { return false; }

            if (String.IsNullOrEmpty(json)) return false;

            JObject jo = JObject.Parse(json);
            JToken nodes = jo.SelectToken("*.stats");


            float?[] items = new float?[8];

            for (int i = 0; i < 8; i++)
            {
                if(int.TryParse(nodes.SelectToken($@"$.[?(@.name == '{parseZones[i]}')]['value']").ToString(),out int result))
                  items[i] = result;
            }



            CSGOStats.Winrate         = items[7] != 0 ? (items[6] / items[7]) : null;
            CSGOStats.KD              = items[1] != 0 ? (items[0] / items[1]) : null;
            CSGOStats.HeadshotPercent = items[0] != 0 ? (items[2] / items[0]) : null;
            CSGOStats.Accuracy        = items[4] != 0 ? (items[3] / items[4]) : null;

            CSGOStats.Kills         = (int?)items[0];
            CSGOStats.Deaths        = (int?)items[1];
            CSGOStats.Headshots     = (int?)items[2];
            CSGOStats.ShotsHit      = (int?)items[3];
            CSGOStats.TotalShots    = (int?)items[4];
            CSGOStats.RoundsPlayed  = (int?)items[5];
            CSGOStats.MatchesWon    = (int?)items[6];
            CSGOStats.PlayedMatches = (int?)items[7];

            webClient.Dispose();
            return true;
        }



        public async Task RankParse()
        {
            int calcellationTime = 8000;
            using (var browser = new WebBrowser())
            {
                bool IsDocumentLoaded = false;
                browser.ScriptErrorsSuppressed = true;
                browser.DocumentCompleted += (obj, sender) => IsDocumentLoaded = true;
                browser.Navigate($"https://csgostats.gg/player/{_steamId64}");
                for (int i = 0; i < calcellationTime; i+=100)
                {
                    if (IsDocumentLoaded) break;
                    await Task.Delay(100);
                }

                if(browser.Document == null)
                {
                    CSGOStats.BestRank = CSGOStats.CurrentRank = "skillgroup_none";
                    return;
                }

                var imgs = browser.Document.Images;
                for (int i = 0; i < imgs.Count; i++)
                {
                    var text = imgs[i].OuterHtml;
                    if (text.StartsWith("<IMG src=\"https://static.csgostats.gg/images/ranks/") && text.EndsWith("width=92>"))
                    {
                        var best = imgs[i + 1];
                        if (best.OuterHtml.StartsWith("<IMG src=\"https://static.csgostats.gg/images/ranks/") && best.OuterHtml.EndsWith("height=24>"))
                            CSGOStats.BestRank = "skillgroup" + best.GetAttribute("src").Split('/').Last().Replace(".png", "");

                        CSGOStats.CurrentRank = "skillgroup"+ imgs[i].GetAttribute("src").Split('/').Last().Replace(".png","");
                        break;
                    }
                }
            };
        }

    }
}
