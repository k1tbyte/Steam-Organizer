using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Security.Cryptography;

namespace Steam_Account_Manager
{
    internal static class Utilities
    {
        private static HttpClient HttpClientFactory;
        private static System.Windows.Media.BrushConverter BrushConverter;
        private static string UserXmlProfileCache;
        private static ulong UserXmlProfileCacheId;
        public static DateTime? UnixTimeToDateTime(long unixtime)
        {
            if (unixtime == 0)
                return null;
            DateTime origin = new DateTime(1970, 1, 1, 0, 0, 0);
            return origin.AddSeconds(unixtime);
        }

        public static ulong GetSystemUnixTime()
        {
            return (ulong)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
        }


        public static long SteamId64ToSteamId32(long steamId64) => steamId64 - 76561197960265728;
        public static string SteamId32ToSteamId64(int steamId32) => (steamId32 + 76561197960265728).ToString();
        public static uint SteamId64ToSteamId32(string steamId64)
        {
            var lId = ulong.Parse(steamId64) - 76561197960265728;
            return Convert.ToUInt32(lId);
        }

        

        public static ref HttpClient CreateHttpClientFactory()
        {
            if(HttpClientFactory == null)
            {
                HttpClientFactory = new HttpClient(new HttpClientHandler(), disposeHandler: false);
            }
            return ref HttpClientFactory;
        }

        public static System.Windows.Media.Brush StringToBrush(string Color)
        {
            if(BrushConverter == null)
            {
                BrushConverter = new System.Windows.Media.BrushConverter();
            }
            var Brush = (System.Windows.Media.Brush)BrushConverter.ConvertFromString(Color);
            Brush.Freeze();
            return Brush;
        }

        public static string BetweenStr(string str,string leftStr, string rightStr)
        {
            int Pos1 = str.IndexOf(leftStr) + leftStr.Length;
            int Pos2 = str.IndexOf(rightStr);
            return str.Substring(Pos1, Pos2 - Pos1);
        }

        public static string GetSteamAvatarUrl(ulong steamId64,bool fromCache = true,EAvatarType type = EAvatarType.Full)
        {
            try
            {
                if(fromCache && !String.IsNullOrEmpty(UserXmlProfileCache) && steamId64 == UserXmlProfileCacheId)
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

        public static string GetSteamNickname(ulong steamId64,bool fromCache = true)
        {
            try
            {
                if(fromCache && !String.IsNullOrEmpty(UserXmlProfileCache) && steamId64 == UserXmlProfileCacheId)
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


        #region Registry
        public static int GetSteamRegistryActiveUser()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                using (registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam\\ActiveProcess", false))
                {
                    return Convert.ToInt32(registryKey.GetValue("ActiveUser"));
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
            catch { throw; }
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
        #endregion

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

        public static void KillSteamAndConnect(string steamDir,string args="")
        {
            using (Process processSteam = new Process())
            {
                processSteam.StartInfo.UseShellExecute = false;
                processSteam.StartInfo.CreateNoWindow = true;
                processSteam.StartInfo.FileName = "taskkill";
                processSteam.StartInfo.Arguments = "/F /T /IM steam.exe";
                processSteam.Start();
            };
            System.Threading.Thread.Sleep(2000);
            using (Process processSteam = new Process())
            {
                processSteam.StartInfo.UseShellExecute = true;
                processSteam.StartInfo.FileName = steamDir;
                processSteam.StartInfo.Arguments = args;
                processSteam.Start();
            };
        }

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

        public enum EAvatarType : byte
        {
            Icon,
            Medium,
            Full
        }
    }
}
