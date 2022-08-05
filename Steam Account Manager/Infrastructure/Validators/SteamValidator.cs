using Newtonsoft.Json;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.Infrastructure.Validators
{
    internal class SteamValidator
    {
        private static string APIKey = "55BB053C506F844D66D88D44F5598EC5";
        private const byte maxSteamID64Len = 17;
        private string steamLink;
        private string steamID64;
        private steamLinkTypes steamLinkType = steamLinkTypes.unknown;
        
        public enum steamLinkTypes
        {
            unknown,
            steamID64Link,
            steamID64,
            customIDLink,
            customID,
            errorType
        }

        public SteamValidator(string steamProfileLink)
        {
            this.steamLink = steamProfileLink;
            try
            {
                CheckSteamLinkType();
                ConvertLinkToId64();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.ToString());
                throw;
            }
        }


        #region SteamID Correct Checkers
        private bool IsSteamID64Correct(string steamID64)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + APIKey + "&steamids=" + steamID64;
            var json = new WebClient().DownloadString(apiString);
            return (steamID64.Length == maxSteamID64Len && steamID64.All(char.IsDigit) && json != "{\"response\":{\"players\":[]}}");
        }

        private bool IsCustomIDCorrect(string customID)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + APIKey + "&vanityurl=" + customID;
            var json = new WebClient().DownloadString(apiString);
            var list = JsonConvert.DeserializeObject<Root>(json);
            if (list.response.success == 1) return true;
            else return false;
        } 
        #endregion

        private string ConvertCustomToId64(string customId)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + APIKey + "&vanityurl=" + customId;
            var json = new WebClient().DownloadString(apiString);
            var list = JsonConvert.DeserializeObject<Root>(json);
            return list.response.steamid;
        }

        private void ConvertLinkToId64()
        {
            if (steamLinkType != steamLinkTypes.unknown && steamLinkType != steamLinkTypes.errorType)
            {
                if (steamLinkType == steamLinkTypes.steamID64Link)
                {
                    string[] steamLinkArr = steamLink.Split('/');
                    string steamId = steamLinkArr.Last(l => { return l != ""; });
                    steamID64 = steamId;
                }
                else if (steamLinkType == steamLinkTypes.steamID64)
                {
                    steamID64 = steamLink;
                }
                else if (steamLinkType == steamLinkTypes.customIDLink)
                {
                    string[] steamLinkArr = steamLink.Split('/');
                    string steamId = steamLinkArr.Last(l => { return l != ""; });
                    steamID64 = ConvertCustomToId64(steamId);
                }
                else if (steamLinkType == steamLinkTypes.customID)
                {
                    steamID64 = ConvertCustomToId64(steamLink);
                }
            }
            else
            {
                steamID64 = "";
            }
        }

        private void CheckSteamLinkType()
        {
            if (Uri.IsWellFormedUriString(steamLink, UriKind.RelativeOrAbsolute)
                && (steamLink.Contains("https://steamcommunity.com/") || steamLink.Contains("steamcommunity.com/"))
                && (steamLink.Contains("/id/") || steamLink.Contains("/profiles/")))
            {
                string[] steamLinkArr = steamLink.Split('/');
                string steamId = steamLinkArr.Last(l => { return l != ""; });
                if (steamLink.Contains("/profiles/"))
                {
                    if (IsSteamID64Correct(steamId))
                        steamLinkType = steamLinkTypes.steamID64Link;
                }
                else
                {
                    if (IsCustomIDCorrect(steamId))
                        steamLinkType = steamLinkTypes.customIDLink;
                }
            }
            else
            {
                string steamId = steamLink;
                if (steamId.All(char.IsDigit))
                {
                    if (IsSteamID64Correct(steamId))
                        steamLinkType = steamLinkTypes.steamID64;
                }
                else
                {
                    if (IsCustomIDCorrect(steamId))
                        steamLinkType = steamLinkTypes.customID;
                }
            }
            if (steamLinkType == steamLinkTypes.unknown)
                steamLinkType = steamLinkTypes.errorType;
        }


        public ulong GetSteamID64()
        {
            return ulong.Parse(steamID64);
        }

        public steamLinkTypes GetSteamLinkType()
        {
            return steamLinkType;
        }

        private class Response
        {
            public string steamid { get; set; }
            public int success { get; set; }
        }

        private class Root
        {
            public Response response { get; set; }
        }

    }
}
