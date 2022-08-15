using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.Http;
using HtmlAgilityPack;
using Steam_Account_Manager.Infrastructure.GamesModels;

namespace Steam_Account_Manager.Infrastructure.Parsers
{
    internal class CsgoParser
    {
        private string _steamId64;

        private CsgoStats csgoStats = new CsgoStats();
        public CsgoParser(string SteamId64)
        {
            _steamId64 = SteamId64;
        }

        public ref CsgoStats GetCsgoStats => ref csgoStats;

        //Global csgo statisctics parser
        public void GlobalStatsParse()
        {
            var target = new Uri($"https://csgo-stats.com/player/{_steamId64}/");
            var handler = new HttpClientHandler
            {
                UseDefaultCredentials = true
            };
            var client = new HttpClient(handler);
            client.DefaultRequestHeaders.Add("accept", "text/javascript, text/html, application/xml, text/xml, */*");
            client.DefaultRequestHeaders.Add("Referer", "https://csgo-stats.com/");
            client.DefaultRequestHeaders.Add("user-agent", "Mozilla/5.0 (Linux; U; Android 4.1.1; en-us; Google Nexus 4 - 4.1.1 - API 16 - 768x1280 Build/JRO03S) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30");

            var response = client.GetAsync(target).Result;
            var html = response.Content.ReadAsStringAsync().Result;
            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(html);

            var csgo_global_stats = htmlDoc.DocumentNode.SelectNodes("//div[@class='panel-body']//p[@class='other-stats-data']").Reverse().Skip(18);

            csgoStats.ShotsHit = csgo_global_stats.ElementAt(0).InnerText;
            csgoStats.RoundsPlayed = csgo_global_stats.ElementAt(1).InnerText;
            csgoStats.Headshots = csgo_global_stats.ElementAt(2).InnerText;
            csgoStats.TotalShots = csgo_global_stats.ElementAt(3).InnerText;
            csgoStats.MatchesWon = csgo_global_stats.ElementAt(4).InnerText;
            csgoStats.Deaths = csgo_global_stats.ElementAt(5).InnerText;
            csgoStats.PlayedMatches = csgo_global_stats.ElementAt(7).InnerText;
            csgoStats.Kills = csgo_global_stats.ElementAt(8).InnerText;

            csgoStats.Winrate = csgoStats.PlayedMatches != "0" ? (float.Parse(csgoStats.MatchesWon.Replace(",", string.Empty)) /
                float.Parse(csgoStats.PlayedMatches.Replace(",", string.Empty)) * 100).ToString("0.00") + "%" : "-";

            csgoStats.KD = csgoStats.Deaths != "0" ? (float.Parse(csgoStats.Kills.Replace(",", string.Empty)) /
                float.Parse(csgoStats.Deaths.Replace(",", string.Empty))).ToString("0.00") : "-";

            csgoStats.HeadshotPercent = csgoStats.Kills != "0" ? (float.Parse(csgoStats.Headshots.Replace(",", string.Empty)) /
                float.Parse(csgoStats.Kills.Replace(",", string.Empty)) * 100).ToString("0.0") + "%" : "-";

            csgoStats.Accuracy = csgoStats.TotalShots != "0" ? (float.Parse(csgoStats.ShotsHit.Replace(",", string.Empty)) /
                float.Parse(csgoStats.TotalShots.Replace(",", string.Empty)) * 100).ToString("0.0") + "%" : "-";

            /// <summary>
            /// 
            /// 1. Shots hit
            /// 2. Rounds played
            /// 3. Headshoots
            /// 4. Total shots
            /// 5. Total mathes won
            /// 6. Deaths
            /// 7. Aiming snipers killed
            /// 8. Total played matches
            /// 9. Kills
            /// 
            /// </summary>
            handler.Dispose();
            client.Dispose();
        }



        // External rank parser
        public async void RankParse()
        {
            //External parser because the site csgostats.gg does not enter the .Dot NET Framework :\ 
            using (Process rankParser = new Process())
            {
                rankParser.StartInfo.UseShellExecute = false;
                rankParser.StartInfo.CreateNoWindow = true;
                rankParser.StartInfo.RedirectStandardOutput = true;
                rankParser.StartInfo.FileName = $"{Directory.GetCurrentDirectory()}\\Binary\\CSGO_RankParser.exe";
                rankParser.StartInfo.Arguments = _steamId64;
                rankParser.Start();

                //[0] - current skillgroup [1] - best skillgroup
                string[] result = rankParser.StandardOutput.ReadToEnd().Split(' ');

                csgoStats.CurrentRank = result[0];
                csgoStats.BestRank = result[1];
                rankParser.WaitForExit();
            };
        }

    }
}
