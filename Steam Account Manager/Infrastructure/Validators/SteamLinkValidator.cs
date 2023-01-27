using Newtonsoft.Json;
using System;
using System.Linq;
using System.Net;

namespace Steam_Account_Manager.Infrastructure.Validators
{
    internal sealed class SteamLinkValidator
    {

        private string _apiKey = Keys.STEAM_API_KEY;

        private const byte MaxSteamId64Len = 17;
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
            CustomIdLink,
            CustomId,
        }

        public SteamLinkValidator(string steamProfileLink)
        {
            _steamLink = steamProfileLink;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                _apiKey = Config.Properties.WebApiKey;
        }
        public bool Validate()
        {
            CheckSteamLinkType();
            ConvertLinkToId64();
            return SteamLinkType != SteamLinkTypes.ErrorType;
        }


        #region SteamID Correct Checkers

        private bool IsSteamId64Correct(string steamId64)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=" + _apiKey +
                               "&steamids=" + steamId64;
            string json = new WebClient().DownloadString(apiString);
            return steamId64.Length == MaxSteamId64Len && steamId64.All(char.IsDigit) &&
                   json != "{\"response\":{\"players\":[]}}";
        }

        private bool IsCustomIdCorrect(string customId)
        {
            string apiString = "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=" + _apiKey +
                               "&vanityurl=" + customId;
            string json = new WebClient().DownloadString(apiString);
            Root list = JsonConvert.DeserializeObject<Root>(json);
            if (list.Response.Success == 1) return true;
            return false;
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
            }
            else
            {
                SteamId64 = "";
            }
        }

        private void CheckSteamLinkType()
        {
            if (Uri.IsWellFormedUriString(_steamLink, UriKind.RelativeOrAbsolute)
                && (_steamLink.Contains("https://steamcommunity.com/") || _steamLink.Contains("steamcommunity.com/"))
                && (_steamLink.Contains("/id/") || _steamLink.Contains("/profiles/")))
            {
                string[] steamLinkArr = _steamLink.Split('/');
                string steamId = steamLinkArr.Last(l => { return l != ""; });
                if (_steamLink.Contains("/profiles/"))
                {
                    if (IsSteamId64Correct(steamId))
                        SteamLinkType = SteamLinkTypes.SteamId64Link;
                }
                else
                {
                    if (IsCustomIdCorrect(steamId))
                        SteamLinkType = SteamLinkTypes.CustomIdLink;
                }
            }
            else
            {
                string steamId = _steamLink;
                if (steamId.All(char.IsDigit))
                {
                    if (IsSteamId64Correct(steamId))
                        SteamLinkType = SteamLinkTypes.SteamId64;
                }
                else
                {
                    if (IsCustomIdCorrect(steamId))
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
