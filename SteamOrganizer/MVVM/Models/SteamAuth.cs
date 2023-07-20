using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using static SteamKit2.GC.Dota.Internal.CMsgDOTABotDebugInfo;

namespace SteamOrganizer.MVVM.Models
{
    [Serializable]
    internal sealed class SteamAuth
    {
        #region JSON
        [field: NonSerialized]
        [JsonProperty(Required = Required.Always)]
        public string Account_name { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Device_id { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Identity_secret { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Revocation_code { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Secret_1 { get; set; }

        [JsonProperty(Required = Required.Always)]
        public ulong Serial_number { get; set; }

        [JsonProperty(Required = Required.Always)]
        public long Server_time { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Shared_secret { get; set; }

        [JsonProperty(Required = Required.Always)]
        public short Status { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Token_gid { get; set; }

        [field: NonSerialized]
        [JsonProperty(Required = Required.Always)]
        public string Uri { get; set; }

        [JsonIgnore]
        public string Secret { get; set; }

        [JsonConstructor]
        private SteamAuth() { } 
        #endregion

        private const byte SteamTimeTTL = 15;
        private const byte CodeInterval = 30;
        private static DateTime LastSteamTimeCheck;
        private static int? SteamTimeDifference;
        private static readonly byte[] SteamCodeCharacters = new byte[] 
        { 
            50, 51, 52, 53, 54, 55, 56, 57, 66, 67, 68, 70, 71, 72, 74, 75, 77, 78, 80, 81, 82, 84, 86, 87, 88, 89 
        };

        internal static async Task<long> GetSteamTime()
        {
            if (SteamTimeDifference.HasValue && DateTime.UtcNow.Subtract(LastSteamTimeCheck).TotalMinutes < SteamTimeTTL)
            {
                return Utils.GetUnixTime() + SteamTimeDifference.Value;
            }

            try
            {
                string response = await App.WebBrowser.PostStringAsync("https://api.steampowered.com/ITwoFactorService/QueryTime/v0001", "steamid=0").ConfigureAwait(false);
                if (response == null)
                {
                    return 0;
                }

                var serverTime = Convert.ToInt64(Regex.Match(response, "(?<=\"server_time\":\")[0-9]+")?.Value);

                if (serverTime == 0)
                {
                    return Utils.GetUnixTime();
                }

                SteamTimeDifference = unchecked((int)(serverTime - Utils.GetUnixTime()));
                LastSteamTimeCheck = DateTime.UtcNow;
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
                return 0;
            }

            return Utils.GetUnixTime() + SteamTimeDifference.Value;
        }

        internal async  Task<string> GenerateCode()
        {
            var time = await GetSteamTime().ConfigureAwait(false);
            if (string.IsNullOrEmpty(Shared_secret) || time == 0)
            {
                return null;
            }

            byte[] sharedSecretArray = Convert.FromBase64String(Shared_secret);
            byte[] timeArray         = BitConverter.GetBytes(time/CodeInterval);

            if(BitConverter.IsLittleEndian)
            {
                Array.Reverse(timeArray);
            }

            using (var hmacGenerator = new HMACSHA1(sharedSecretArray))
            {
                byte[] hashedData = hmacGenerator.ComputeHash(timeArray);
                byte[] codeArray  = new byte[5];
                byte b            = (byte)(hashedData[19] & 0xF);
                int codePoint     = (hashedData[b] & 0x7F) << 24 | (hashedData[b + 1] & 0xFF) << 16 | (hashedData[b + 2] & 0xFF) << 8 | (hashedData[b + 3] & 0xFF);

                for (int i = 0; i < 5; ++i)
                {
                    codeArray[i] = SteamCodeCharacters[codePoint % SteamCodeCharacters.Length];
                    codePoint /= SteamCodeCharacters.Length;
                }

                return Encoding.UTF8.GetString(codeArray);
            }
        }
    }
}
