using SteamKit2;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class SteamIDConverter
    {
        private const ulong SteamID64Ident = 76561197960265728;

        /// <summary>
        /// The sequence equals is ESteamIDType
        /// </summary>
        private static readonly Regex[] IDRegexes = new Regex[]
        {
            new Regex("^[0-9]{17}$"),
            new Regex("^[0-9]{1,10}$"),
            new Regex("STEAM_[0-5]:[01]:\\d+$"),
            new Regex("\\[U:1:[0-9]+\\]$"),
            new Regex("^(?=^.{10}$)([A-Za-z\\d]+)\\-([A-Za-z\\d]{4})$"),
            new Regex("steam:([0-9A-Fa-f]{15})+$")
       };

        public enum ESteamIDType : byte
        {
            SteamID64,
            SteamID32,
            SteamID,
            SteamID3,
            CSGOFriendID,
            FiveM,
            LinkID64,
            LinkID3,
            LinkVanityUrl,
            VanityUrl,
            Unknown     //Should always be the last
        }

        #region ToSteamID64
        public static ulong SteamID32ToID64(UInt32 steamId32) => steamId32 + SteamID64Ident;
        public static ulong SteamID32ToID64(string steamId32) => ulong.Parse(steamId32) + SteamID64Ident;
        public static ulong SteamIDToID64(string steamID)
        {
            var chunks = steamID.Split(':');
            return (Convert.ToUInt64(chunks[2]) * 2) + 76561197960265728 + Convert.ToByte(chunks[1]);
        }
        public static ulong SteamID3ToID64(string steamID3) => SteamID32ToID64(steamID3.Split(':').Last().Replace("]", ""));
        public static ulong FiveMToID64(string fiveM) => Convert.ToUInt64(fiveM.Split(':').Last(), 16);
        public static ulong CsgoFriendCodeToID64(string code)
        {
            code = $"AAAA{code.Replace("-", "")}";
            var decoded = Decode(code);
            ulong id = 0;

            for (int i = 0; i < 8; i++)
            {
                decoded >>= 1;
                var idNibble = decoded & 0xFul;
                decoded >>= 4;

                id <<= 4;
                id |= idNibble;
            }

            return id + SteamID64Ident;
        }

        public static ulong LinkID64ToID64(string linkID64)   => ulong.Parse(IDFromLink(linkID64));
        public static ulong LinkID3ToID64(string linkID3)     => SteamID3ToID64(IDFromLink(linkID3));
        public static async Task<ulong> VanityUrlToID64(string vanityURL) => await RetrieveSteamID64($"https://steamcommunity.com/id/{vanityURL}");
        public static async Task<ulong> VanityUrlLinkToID64(string vanityURLLink) => await RetrieveSteamID64(vanityURLLink.TrimEnd('/'));
        #endregion

        #region FromSteamID64
        public static UInt32? SteamID64To32(ulong? steamID64) => steamID64.HasValue ? (UInt32?)(steamID64 - SteamID64Ident) : null;
        public static string SteamID64ToSteamID(ulong? steamId64)
        {
            if (!steamId64.HasValue) return null;
            var steamAccId = steamId64 - SteamID64Ident;
            return $"STEAM_0:{(steamAccId % 2 == 0 ? 0 : 1)}:{steamAccId / 2}";
        }

        public static string SteamID64ToSteamID3(ulong? steamId64) => steamId64.HasValue ? $"[U:1:{steamId64 - SteamID64Ident}]" : null;
        public static string SteamID64ToFiveM(ulong? steamID64) => steamID64.HasValue ? $"steam:{steamID64:x2}" : null;

        public static string SteamID64ToCsgoFriendCode(ulong? steamId64)
        {
            if (!steamId64.HasValue) return null;
            var id = steamId64.Value;
            var hash = HashSteamId(steamId64.Value);

            var temp = 0ul;
            for (int i = 0; i < 8; i++)
            {
                var idNibble = id & 0xFul;
                id >>= 4;

                var hashNibble = (hash >> i) & 1;
                var a = temp << 4 | idNibble;
                temp = MakeU64(temp >> 28, a);
                temp = MakeU64(temp >> 31, a << 1 | hashNibble);
            }

            return Encode(temp);
        }
        #endregion

        #region Helpers
        private static string IDFromLink(string link) => link.Split('/').Last(o => !String.IsNullOrWhiteSpace(o));

        private static async Task<ulong> RetrieveSteamID64(string steamWebProfileLink)
        {
            using (var wc = new WebClient())
            {
                var str = await wc.DownloadStringTaskAsync(new Uri($"{(steamWebProfileLink.StartsWith("https://") ? steamWebProfileLink : steamWebProfileLink.Insert(0, "https://"))}/?xml=1"));
                if (String.IsNullOrEmpty(str))
                    return 0;

                var id = Utils.Common.BetweenStr(str, "<steamID64>", $"</steamID64>");

                if (String.IsNullOrEmpty(id) || !ulong.TryParse(id, out ulong result))
                    return 0;

                return result;
            }
        }

        private static string Encode(UInt64 input)
        {
            string allNum = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            StringBuilder result = new StringBuilder();
            var bytes = BitConverter.GetBytes(input);

            Array.Reverse(bytes);
            var id = BitConverter.ToUInt64(bytes, 0);

            for (int i = 0; i < 13; i++)
            {
                if (i == 4 || i == 9)
                {
                    result.Append('-');
                }
                result.Append(allNum[(int)(id & 0x1F)]);
                id >>= 5;
            }
            return result.Remove(0, 5).ToString();
        }
        private static UInt64 Decode(string friendCode)
        {
            ulong res = 0;
            var base32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

            for (int i = 0; i < 13; i++)
            {
                res |= (ulong)base32.IndexOf(friendCode[i]) << (5 * i);
            }

            var bytes = BitConverter.GetBytes(res);
            Array.Reverse(bytes);
            return BitConverter.ToUInt64(bytes, 0);
        }

        private static UInt64 FromLittleEndian(byte[] bytes, int end = -1)
        {
            var result = 0ul;
            var entry = 1ul;
            int i = 0;

            foreach (var chunk in bytes)
            {
                if (end != -1 && i == end)
                    break;

                result += (entry * (UInt64)chunk);
                entry *= 256ul;
                i++;
            }
            return result;
        }

        private static UInt64 HashSteamId(ulong steamId64)
        {
            var accountId = steamId64 & 0xFFFFFFFFul;
            var strangeSteamId = accountId | 0x4353474F00000000ul;

            var bytes = BitConverter.GetBytes(strangeSteamId);
            using (System.Security.Cryptography.MD5 md5 = System.Security.Cryptography.MD5.Create())
            {
                return FromLittleEndian(md5.ComputeHash(bytes), 4);
            }
        }

        public static UInt64 MakeU64(UInt64 value1, UInt64 value2) => value1 << 32 | value2;
        #endregion

        public static async Task<ulong> ToSteamID64(string steamID)
        {
            switch (GetSteamIDType(steamID))
            {
                case ESteamIDType.SteamID64:
                    return ulong.Parse(steamID);
                case ESteamIDType.SteamID32:
                    return SteamID32ToID64(steamID);
                case ESteamIDType.SteamID:
                    return SteamIDToID64(steamID);
                case ESteamIDType.SteamID3:
                    return SteamID3ToID64(steamID);
                case ESteamIDType.CSGOFriendID:
                    return CsgoFriendCodeToID64(steamID);
                case ESteamIDType.FiveM:
                    return FiveMToID64(steamID);
                case ESteamIDType.VanityUrl:
                    return await VanityUrlToID64(steamID);
                case ESteamIDType.LinkVanityUrl:
                    return await VanityUrlLinkToID64(steamID);
                case ESteamIDType.LinkID64:
                    return LinkID64ToID64(steamID);
                case ESteamIDType.LinkID3:
                    return LinkID3ToID64(steamID);
                default:
                    return 0;
            }
        }

        public static string FromSteamID64(ulong steamID64, ESteamIDType to)
        {
            if (IDRegexes[(int)to].IsMatch(steamID64.ToString()))
                return steamID64.ToString();

            switch (to)
            {
                case ESteamIDType.SteamID32:
                    return SteamID64To32(steamID64).ToString();
                case ESteamIDType.SteamID:
                    return SteamID64ToSteamID(steamID64);
                case ESteamIDType.SteamID3:
                    return SteamID64ToSteamID3(steamID64);
                case ESteamIDType.CSGOFriendID:
                    return SteamID64ToCsgoFriendCode(steamID64);
                case ESteamIDType.FiveM:
                    return SteamID64ToFiveM(steamID64);
                default:
                    return null;
            }
        }

        public static ESteamIDType GetSteamIDType(string steamID)
        {
            if (String.IsNullOrWhiteSpace(steamID))
                return ESteamIDType.Unknown;

            if ((steamID.StartsWith("https://steamcommunity.com/") || steamID.StartsWith("steamcommunity.com/")) && (steamID.Contains("/profiles/") || steamID.Contains("/id/")))
            {
                var id = IDFromLink(steamID);
                if (IDRegexes[(int)ESteamIDType.SteamID64].IsMatch(id))
                    return ESteamIDType.LinkID64;
                else if (IDRegexes[(int)ESteamIDType.SteamID3].IsMatch(id))
                    return ESteamIDType.LinkID3;
                else if (Regex.IsMatch(id, "^[A-Za-z\\d-]{3,32}$"))
                    return ESteamIDType.LinkVanityUrl;
            }

            for (int i = 0; i < IDRegexes.Length; i++)
            {
                if (IDRegexes[i].IsMatch(steamID))
                    return (ESteamIDType)i;
            }

            if (Regex.IsMatch(steamID, "^[A-Za-z\\d-]{3,32}$"))
                return ESteamIDType.VanityUrl;

            return ESteamIDType.Unknown;
        }

    }
}
