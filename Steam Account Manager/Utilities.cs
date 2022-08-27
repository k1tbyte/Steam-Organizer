using Microsoft.Win32;
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Security.Cryptography;

namespace Steam_Account_Manager
{
    internal class Utilities
    {
        private static HttpClient HttpClientFactory;

        public static DateTime UnixTimeToDateTime(long unixtime)
        {
            DateTime origin = new DateTime(1970, 1, 1, 0, 0, 0);
            return origin.AddSeconds(unixtime);
        }

        public static long SteamId64ToSteamId32(long steamId64) => steamId64 - 76561197960265728;
        public static long SteamId64ToSteamId32(string steamId64) => long.Parse(steamId64) - 76561197960265728;

        public static string SteamId32ToSteamId64(int steamId32) => (steamId32 + 76561197960265728).ToString();

        public static ref HttpClient CreateHttpClientFactory()
        {
            if(HttpClientFactory == null)
            {
                HttpClientFactory = new HttpClient(new HttpClientHandler(), disposeHandler: false);
            }
            return ref HttpClientFactory;
        }

        public static int GetSteamRegistryActiveUser()
        {
            RegistryKey registryKey = Environment.Is64BitOperatingSystem ?
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry64) :
        RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, RegistryView.Registry32);
            try
            {
                registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam\\ActiveProcess", false);
                return Convert.ToInt32(registryKey.GetValue("ActiveUser"));
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
                registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam", false);
                return (string)registryKey.GetValue("SteamExe");
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
                registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam\\ActiveProcess", false);
                return Convert.ToInt32(registryKey.GetValue("pid"));
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
                registryKey = registryKey.OpenSubKey(@"Software\\Valve\\Steam", false);
                return (string)registryKey.GetValue("Language");
            }
            catch { throw; }
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

        public static void KillSteamAndConnect(string steamDir,string args)
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
    }
}
