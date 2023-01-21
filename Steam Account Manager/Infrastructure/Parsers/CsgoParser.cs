using Newtonsoft.Json.Linq;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
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

        private string _apiKey = Keys.STEAM_API_KEY;

        private string _steamId64;
        private CSGO csgoStats = new CSGO();

        private static readonly string[] parseZones = {
            "total_kills","total_deaths","total_kills_headshot","total_shots_hit",
            "total_shots_fired","total_rounds_played","total_matches_won","total_matches_played" };

        public CsgoParser(string SteamId64)
        {
            _steamId64 = SteamId64;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                _apiKey = Config.Properties.WebApiKey;
        }

        public ref CSGO GetCsgoStats => ref csgoStats;

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
        public async Task GlobalStatsParse()
        {
            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(
                $"http://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key={_apiKey}&steamid={_steamId64}");

            JObject jo = JObject.Parse(json);
            JToken nodes = jo.SelectToken("*.stats");


            float[] items = new float[8];

            for (int i = 0; i < 8; i++)
                items[i] = float.Parse(nodes.SelectToken($@"$.[?(@.name == '{parseZones[i]}')]['value']").ToString());


            csgoStats.Winrate         = items[7] != 0 ? (items[6] / items[7] * 100).ToString("0.00") + "%" : "-";
            csgoStats.KD              = items[1] != 0 ? (items[0] / items[1]).ToString("0.00") : "-";
            csgoStats.HeadshotPercent = items[0] != 0 ? (items[2] / items[0] * 100).ToString("0.0") + "%" : "-";
            csgoStats.Accuracy        = items[4] != 0 ? (items[3] / items[4] * 100).ToString("0.0") + "%" : "-";

            csgoStats.Kills         = items[0].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.Deaths        = items[1].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.Headshots     = items[2].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.ShotsHit      = items[3].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.TotalShots    = items[4].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.RoundsPlayed  = items[5].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.MatchesWon    = items[6].ToString("#,#", CultureInfo.InvariantCulture);
            csgoStats.PlayedMatches = items[7].ToString("#,#", CultureInfo.InvariantCulture);

            webClient.Dispose();
        }



        public async Task RankParse()
        {
            int calcellationTime = 6000;
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
                    csgoStats.BestRank = csgoStats.CurrentRank = "skillgroup_none";
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
                            csgoStats.BestRank = "skillgroup" + best.GetAttribute("src").Split('/').Last().Replace(".png", "");

                        csgoStats.CurrentRank = "skillgroup"+ imgs[i].GetAttribute("src").Split('/').Last().Replace(".png","");
                        break;
                    }
                }
            };
        }

    }
}
