using Newtonsoft.Json;
using SteamKit2;
using System;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.Validators
{
    internal sealed class SteamLinkValidator
    {

        private string _apiKey = Keys.STEAM_API_KEY;

        private const byte MaxSteamId64Len = 17;
        private static Regex RegexSteamID2 = new Regex("STEAM_[0-5]:[01]:\\d+$");
        private static Regex RegexSteamID3 = new Regex("\\[U:1:[0-9]+\\]$");

        private readonly string _steamLink;
        public ulong SteamId64Ulong => ulong.Parse(SteamId64);
        public uint SteamId32 => Utils.Common.SteamId64ToSteamId32(SteamId64);
        public string SteamId64 { get; private set; }
        public SteamLinkTypes SteamLinkType { get; private set; } = SteamLinkTypes.ErrorType;

        public enum SteamLinkTypes
        {
            ErrorType,
            SteamId64Link,
            SteamId64,
            SteamId32,
            SteamId2,
            SteamId3,
            CustomIdLink,
            CustomId,
        }

        public SteamLinkValidator(string steamProfileLink)
        {
            _steamLink = steamProfileLink;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                _apiKey = Config.Properties.WebApiKey;
        }
        public async Task<bool> Validate()
        {
            await CheckSteamLinkType();
            ConvertLinkToId64();
            return SteamLinkType != SteamLinkTypes.ErrorType;
        }


        #region SteamID Correct Checkers

        private async Task<bool> IsSteamId64Correct(string steamId64)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + _apiKey +
                               "&steamids=" + steamId64;
            using(var wc = new WebClient())
            {
                string json = await wc.DownloadStringTaskAsync(apiString);
                return steamId64.Length == MaxSteamId64Len && steamId64.All(char.IsDigit) &&
                       json != "{\"response\":{\"players\":[]}}";
            }
        }

        private async Task<bool> IsCustomIdCorrect(string customId)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + _apiKey +
                               "&vanityurl=" + customId;
            using (var wc = new WebClient())
            {
                string json = await wc.DownloadStringTaskAsync(apiString);
                Root list = JsonConvert.DeserializeObject<Root>(json);
                if (list.Response.Success == 1) return true;
                return false;
            }

        }

        #endregion

        private string ConvertCustomToId64(string customId)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + _apiKey +
                               "&vanityurl=" + customId;
            string json = new WebClient().DownloadString(apiString);
            Root list = JsonConvert.DeserializeObject<Root>(json);
            return list.Response.Steamid;
        }

        private void ConvertLinkToId64()
        {
            if (SteamLinkType != SteamLinkTypes.ErrorType)
            {
                if (SteamLinkType == SteamLinkTypes.SteamId64Link)
                {
                    string[] steamLinkArr = _steamLink.Split('/');
                    string steamId = steamLinkArr.Last(l => l != "");
                    SteamId64 = steamId;
                }
                else if (SteamLinkType == SteamLinkTypes.SteamId64)
                {
                    SteamId64 = _steamLink;
                }
                else if(SteamLinkType == SteamLinkTypes.SteamId32)
                {
                    SteamId64 = Utils.Common.SteamId32ToSteamId64(_steamLink).ToString();
                }
                else if (SteamLinkType == SteamLinkTypes.CustomIdLink)
                {
                    string[] steamLinkArr = _steamLink.Split('/');
                    string steamId = steamLinkArr.Last(l => l != "");
                    SteamId64 = ConvertCustomToId64(steamId);
                }
                else if (SteamLinkType == SteamLinkTypes.CustomId)
                {
                    SteamId64 = ConvertCustomToId64(_steamLink);
                }
                else if(SteamLinkType == SteamLinkTypes.SteamId2)
                {
                    var chunks = _steamLink.Split(':').Skip(1).ToArray();
                    SteamId64 = ((Convert.ToUInt64(chunks[1]) * 2) + 76561197960265728 + Convert.ToByte(chunks[0])).ToString();
                }
                else if(SteamLinkType == SteamLinkTypes.SteamId3)
                {
                    SteamId64 = Utils.Common.SteamId32ToSteamId64(_steamLink.Split(':').Last().Replace("]", "")).ToString();
                }
            }
            else
            {
                SteamId64 = "";
            }
        }

        private async Task CheckSteamLinkType()
        {
            if(RegexSteamID2.IsMatch(_steamLink))
            {
                SteamLinkType = SteamLinkTypes.SteamId2;
            }
            else if(RegexSteamID3.IsMatch(_steamLink))
            {
                SteamLinkType = SteamLinkTypes.SteamId3;
            }
            else if (Uri.IsWellFormedUriString(_steamLink, UriKind.RelativeOrAbsolute)
                && (_steamLink.Contains("https://steamcommunity.com/") || _steamLink.Contains("steamcommunity.com/"))
                && (_steamLink.Contains("/id/") || _steamLink.Contains("/profiles/")))
            {
                string[] steamLinkArr = _steamLink.Split('/');
                string steamId = steamLinkArr.Last(l => { return l != ""; });
                if (_steamLink.Contains("/profiles/"))
                {
                    if (await IsSteamId64Correct(steamId))
                        SteamLinkType = SteamLinkTypes.SteamId64Link;
                }
                else
                {
                    if (await IsCustomIdCorrect(steamId))
                        SteamLinkType = SteamLinkTypes.CustomIdLink;
                }
            }
            else
            {
                string steamId = _steamLink;
                if (steamId.All(char.IsDigit))
                {
                    if (steamId.Length <= 10 && await IsSteamId64Correct(Utils.Common.SteamId32ToSteamId64(steamId).ToString()))
                        SteamLinkType = SteamLinkTypes.SteamId32;
                    else if (await IsSteamId64Correct(steamId))
                        SteamLinkType = SteamLinkTypes.SteamId64;
                }
                else
                {
                    if (await IsCustomIdCorrect(steamId))
                        SteamLinkType = SteamLinkTypes.CustomId;
                }
            }
        }


        private class Response
        {
            public string Steamid { get; set; }
            public int Success { get; set; }
        }

        private class Root
        {
            public Response Response { get; set; }
        }

    }
}
