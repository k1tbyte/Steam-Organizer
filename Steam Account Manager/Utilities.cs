using System;

namespace Steam_Account_Manager
{
    internal class Utilities
    {
        public static DateTime UnixTimeToDateTime(long unixtime)
        {
            DateTime origin = new DateTime(1970, 1, 1, 0, 0, 0);
            return origin.AddSeconds(unixtime);
        }

        public static long SteamId64ToSteamId32(long steamId64) => steamId64 - 76561197960265728;
        public static long SteamId64ToSteamId32(string steamId64) => long.Parse(steamId64) - 76561197960265728;
    }
}
