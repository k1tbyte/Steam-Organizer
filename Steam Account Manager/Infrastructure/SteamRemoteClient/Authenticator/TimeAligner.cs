using Newtonsoft.Json;
using System;
using System.Net;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator
{
    /// <summary>
    /// Class to help align system time with the Steam server time. Not super advanced; probably not taking some things into account that it should.
    /// Necessary to generate up-to-date codes. In general, this will have an error of less than a second, assuming Steam is operational.
    /// </summary>
    public class TimeAligner
    {
        private static bool _aligned = false;
        private static int _timeDifference = 0;

        public static long GetSteamTime()
        {
            if (!TimeAligner._aligned)
            {
                TimeAligner.AlignTime();
            }
            return Utils.Common.GetSystemUnixTime() + _timeDifference;
        }

        public static async Task<long> GetSteamTimeAsync()
        {
            if (!TimeAligner._aligned)
            {
                await TimeAligner.AlignTimeAsync();
            }
            return Utils.Common.GetSystemUnixTime() + _timeDifference;
        }

        public static void AlignTime()
        {
            long currentTime = Utils.Common.GetSystemUnixTime();
            using (WebClient client = new WebClient())
            {
                try
                {
                    string response = client.UploadString(SteamWeb.TWO_FACTOR_TIME_QUERY, "steamid=0");
                    TimeQuery query = JsonConvert.DeserializeObject<TimeQuery>(response);
                    _timeDifference = (int)(query.Response.ServerTime - currentTime);
                    _aligned = true;
                }
                catch (WebException)
                {
                    return;
                }
            }
        }

        public static async Task AlignTimeAsync()
        {
            long currentTime = Utils.Common.GetSystemUnixTime();
            WebClient client = new WebClient();
            try
            {
                string response = await client.UploadStringTaskAsync(new Uri(SteamWeb.TWO_FACTOR_TIME_QUERY), "steamid=0");
                TimeQuery query = JsonConvert.DeserializeObject<TimeQuery>(response);
                TimeAligner._timeDifference = (int)(query.Response.ServerTime - currentTime);
                TimeAligner._aligned = true;
            }
            catch (WebException)
            {
                return;
            }
        }

        internal class TimeQuery
        {
            [JsonProperty("response")]
            internal TimeQueryResponse Response { get; set; }

            internal class TimeQueryResponse
            {
                [JsonProperty("server_time")]
                public long ServerTime { get; set; }
            }

        }
    }
}
