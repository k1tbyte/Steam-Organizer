using Newtonsoft.Json;
using System;
using System.Linq;
using System.Net;
using System.Windows;

namespace Steam_Account_Manager.Infrastructure.Validators
{
    internal class SteamValidator
    {
        private const string _apiKey = "55BB053C506F844D66D88D44F5598EC5";
        private const byte MaxSteamId64Len = 17;
        private readonly string _steamLink;
        private string _steamId64;
        private SteamLinkTypes _steamLinkType = SteamLinkTypes.Unknown;
        
        public enum SteamLinkTypes
        {
            Unknown,
            SteamId64Link,
            SteamId64,
            CustomIdLink,
            CustomId,
            ErrorType
        }

        public SteamValidator(string steamProfileLink)
        {
            _steamLink = steamProfileLink;
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
            if (_steamLinkType != SteamLinkTypes.Unknown && _steamLinkType != SteamLinkTypes.ErrorType)
            {
                if (_steamLinkType == SteamLinkTypes.SteamId64Link)
                {
                    string[] steamLinkArr = _steamLink.Split('/');
                    string steamId = steamLinkArr.Last(l => l != "");
                    _steamId64 = steamId;
                }
                else if (_steamLinkType == SteamLinkTypes.SteamId64)
                {
                    _steamId64 = _steamLink;
                }
                else if (_steamLinkType == SteamLinkTypes.CustomIdLink)
                {
                    string[] steamLinkArr = _steamLink.Split('/');
                    string steamId = steamLinkArr.Last(l => l != "");
                    _steamId64 = ConvertCustomToId64(steamId);
                }
                else if (_steamLinkType == SteamLinkTypes.CustomId)
                {
                    _steamId64 = ConvertCustomToId64(_steamLink);
                }
            }
            else
            {
                _steamId64 = "";
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
                        _steamLinkType = SteamLinkTypes.SteamId64Link;
                }
                else
                {
                    if (IsCustomIdCorrect(steamId))
                        _steamLinkType = SteamLinkTypes.CustomIdLink;
                }
            }
            else
            {
                string steamId = _steamLink;
                if (steamId.All(char.IsDigit))
                {
                    if (IsSteamId64Correct(steamId))
                        _steamLinkType = SteamLinkTypes.SteamId64;
                }
                else
                {
                    if (IsCustomIdCorrect(steamId))
                        _steamLinkType = SteamLinkTypes.CustomId;
                }
            }
            if (_steamLinkType == SteamLinkTypes.Unknown)
                _steamLinkType = SteamLinkTypes.ErrorType;
        }


        public string GetSteamId64()
        {
            return _steamId64;
        }

        public SteamLinkTypes GetSteamLinkType()
        {
            return _steamLinkType;
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
