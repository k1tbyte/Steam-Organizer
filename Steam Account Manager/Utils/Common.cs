using Microsoft.Win32;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography;

namespace Steam_Account_Manager.Utils
{
    internal static class Common
    {
        public enum EAvatarType : byte
        {
            Icon,
            Medium,
            Full
        }

        private static HttpClient HttpClientFactory;
        private static string UserXmlProfileCache;
        private static ulong UserXmlProfileCacheId;


        public static long GetSystemUnixTime() => (long)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        public static DateTime? UnixTimeToDateTime(ulong unixtime)
        {
            if (unixtime == 0)
                return null;
            DateTime origin = new DateTime(1970, 1, 1, 0, 0, 0);
            return origin.AddSeconds(unixtime);
        }


        public static bool CheckInternetConnection()
        {
            try
            {
                Dns.GetHostEntry("google.com");
                return true;
            }
            catch
            {
                return false;
            }
        }
        public static ref HttpClient CreateHttpClientFactory()
        {
            if (HttpClientFactory == null)
            {
                HttpClientFactory = new HttpClient(new HttpClientHandler(), disposeHandler: false);
            }
            return ref HttpClientFactory;
        }
        public static IList<T> Swap<T>(this IList<T> list, int indexA, int indexB)
        {
            T tmp = list[indexA];
            list[indexA] = list[indexB];
            list[indexB] = tmp;
            return list;
        }
        public static string BetweenStr(string str, string leftStr, string rightStr,bool relative = false)
        {
            try
            {
                int Pos1 = str.IndexOf(leftStr) + leftStr.Length;
                int Pos2 = relative ? str.IndexOf(rightStr,Pos1) : str.IndexOf(rightStr);
                return str.Substring(Pos1, Pos2 - Pos1);
            }
            catch
            {
                return null;
            }
        }

        public static bool Exists<T>(this ObservableCollection<T> collection, Func<T,bool> match)
        {
            var tmp = collection.Where(match);
            return tmp.Any();
        }

        public static  T Find<T>(this ObservableCollection<T> collection, Func<T,bool> match) => collection.Where(match).FirstOrDefault();


        #region Encryption
        public static string Sha256(string randomString)
        {
            var crypt = new SHA256Managed();
            string hash = String.Empty;
            byte[] crypto = crypt.ComputeHash(System.Text.Encoding.ASCII.GetBytes(randomString));
            foreach (byte theByte in crypto)
            {
                hash += theByte.ToString("x2");
            }
            return hash;
        }
        public static string GenerateCryptoKey()
        {
            //Generate a cryptographic random number.
            RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider();
            byte[] buff = new byte[32];
            rng.GetBytes(buff);

            // Return a Base64 string representation of the random number.
            return Convert.ToBase64String(buff);
        }
        public static byte[] HexStringToByteArray(string hex)
        {
            int hexLen = hex.Length;
            byte[] ret = new byte[hexLen / 2];
            for (int i = 0; i < hexLen; i += 2)
            {
                ret[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);
            }
            return ret;
        }
        #endregion

        public static void ToLittleEndian(ref byte[] bytes)
        {
            for (int i = 0,bit = 0; i < bytes.Length; i++)
            {

            }
        }


        #region Steam
        private const ulong SteamID64Ident = 76561197960265728;
        public static UInt32? SteamId64ToSteamId32(ulong? steamId64) => steamId64.HasValue ? (UInt32?)(steamId64.Value - SteamID64Ident) : null;
        public static ulong SteamId32ToSteamId64(UInt32 steamId32)   => steamId32 + SteamID64Ident;
        public static ulong SteamId32ToSteamId64(string steamId32)   => ulong.Parse(steamId32) + SteamID64Ident;
        public static string SteamId64ToSteamID3(ulong? steamId64)   => steamId64.HasValue ? $"[U:1:{steamId64 - SteamID64Ident}]" : null;
        public static uint SteamId64ToSteamId32(string steamId64)
        {
            if (String.IsNullOrEmpty(steamId64)) return 0;
            var lId = ulong.Parse(steamId64) - SteamID64Ident;
            return Convert.ToUInt32(lId);
        }
        public static string SteamId64ToSteamID(ulong? steamId64)
        {
            if (!steamId64.HasValue)
                return null;

            var steamAccId = steamId64 - SteamID64Ident;
            return $"STEAM_0:{(steamAccId % 2 == 0 ? 0 : 1)}:{steamAccId / 2}";
        }

        public static string GetSteamAvatarUrl(ulong steamId64, bool fromCache = true, EAvatarType type = EAvatarType.Full)
        {
            try
            {
                if (fromCache && !String.IsNullOrEmpty(UserXmlProfileCache) && steamId64 == UserXmlProfileCacheId)
                {
                    return BetweenStr(UserXmlProfileCache, $"<avatar{type}><![CDATA[", $"]]></avatar{type}>");
                }
                UserXmlProfileCacheId = steamId64;
                using (HttpResponseMessage response = HttpClientFactory.GetAsync($"https://steamcommunity.com/profiles/{steamId64}?xml=1").Result)
                {
                    using (HttpContent content = response.Content)
                    {
                        UserXmlProfileCache = content.ReadAsStringAsync().Result;
                        return BetweenStr(UserXmlProfileCache, $"<avatar{type}><![CDATA[", $"]]></avatar{type}>");
                    }
                }
            }
            catch
            {
                return null;
            }
        }
        public static string GetSteamNickname(ulong steamId64, bool fromCache = true)
        {
            try
            {
                if (fromCache && !String.IsNullOrEmpty(UserXmlProfileCache) && steamId64 == UserXmlProfileCacheId)
                {
                    return BetweenStr(UserXmlProfileCache, $"<steamID><![CDATA[", $"]]></steamID>");
                }
                UserXmlProfileCacheId = steamId64;
                using (HttpResponseMessage response = HttpClientFactory.GetAsync($"https://steamcommunity.com/profiles/{steamId64}?xml=1").Result)
                {
                    using (HttpContent content = response.Content)
                    {
                        UserXmlProfileCache = content.ReadAsStringAsync().Result;
                        return BetweenStr(UserXmlProfileCache, $"<steamID><![CDATA[", $"]]></steamID>");
                    }
                }
            }
            catch
            {
                return null;
            }
        }
        public static void KillSteamProcess()
        {
            using (Process processSteam = new Process())
            {
                processSteam.StartInfo.UseShellExecute = false;
                processSteam.StartInfo.CreateNoWindow = true;
                processSteam.StartInfo.FileName = "taskkill";
                processSteam.StartInfo.Arguments = "/F /T /IM steam.exe";
                processSteam.Start();
            };
        }
        public static void KillSteamAndConnect(string steamDir, string args)
        {
            KillSteamProcess();
            System.Threading.Thread.Sleep(1500);
            ConnectSteam(steamDir, args);
        }

        public static void ConnectSteam(string steamDir, string args)
        {
            using (Process processSteam = new Process())
            {
                processSteam.StartInfo.UseShellExecute = true;
                processSteam.StartInfo.FileName = steamDir;
                processSteam.StartInfo.Arguments = args;
                processSteam.Start();
            };
        }
        #endregion

        #region Registry
        public static uint GetSteamRegistryActiveUser()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam\\ActiveProcess", false))
                {
                    return Convert.ToUInt32(registryKey.GetValue("ActiveUser"));
                }

            }
            catch { throw; }
        }

        public static string GetSteamRegistryDirection()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam", false))
                {
                    return (string)registryKey.GetValue("SteamExe");
                }

            }
            catch { return null; }
        }

        public static int GetSteamRegistryHWND()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam\\ActiveProcess", false))
                {
                    return Convert.ToInt32(registryKey.GetValue("pid"));
                }

            }
            catch { throw; }
        }

        public static string GetSteamRegistryLanguage()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam", false))
                {
                    return (string)registryKey.GetValue("Language");
                }

            }
            catch { throw; }
        }

        public static string GetSteamRegistryRememberUser()
        {
            string RememberUser = String.Empty;

            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam", false))
                {
                    RememberUser = registryKey.GetValue("AutoLoginUser").ToString();
                }

            }
            catch { throw; }
            return RememberUser;
        }

        public static void SetSteamRegistryRememberUser(string autoLoginUser)
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
                RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
                RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam", true))
                {
                    registryKey.SetValue("AutoLoginUser", autoLoginUser, RegistryValueKind.String);
                }

            }
            catch { throw; }
        }

        public static bool IsRegistryAutoStartup()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
                RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
                RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    var value = registryKey.GetValue("SteamAccountManager") as string;
                    return !string.IsNullOrEmpty(value);
                }
            }
            catch { throw; }
        }

        public static void SetRegistryAutostartup(bool isSet)
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
                RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
                RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    var value = registryKey.GetValue("SteamAccountManager") as string;
                    var path = Assembly.GetExecutingAssembly().Location;
                    if (string.IsNullOrEmpty(value) && isSet)
                    {
                        registryKey.SetValue("SteamAccountManager", path);
                    }
                    else if (!isSet)
                    {
                        registryKey.DeleteValue("SteamAccountManager", false);
                    }
                }
            }
            catch { throw; }
        }

        #endregion
    }
}
