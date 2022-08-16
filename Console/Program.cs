using System;
using SteamAuth;
using Newtonsoft.Json;
using System.IO;
using System.Threading.Tasks;
using System.Net;
using System.Text;
using Microsoft.Win32;
using System.Diagnostics;

namespace ConsoleProgramm
{
    internal class Program
    {

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

        public static void TestFunc()
        {
            using (Process processSteam = new Process())
            {
                processSteam.StartInfo.UseShellExecute = true;
                processSteam.StartInfo.FileName = "f:/sad.exe";
                processSteam.StartInfo.Arguments = "/F /T /IM steam.exe";
                processSteam.Start();
            };
        }

        static void Main(string[] args)
        {
            var before = 76561199051937995;
            Console.WriteLine(before);
            var after = before - 1091672267;
            Console.WriteLine(after);
            TestFunc();
            Console.WriteLine(after+ 1091672267);
            Console.WriteLine("Active user right now: " + GetSteamRegistryActiveUser());
            Console.WriteLine("Steam directory: " + GetSteamRegistryDirection());
            Console.WriteLine("Steam window descriptor: " + GetSteamRegistryHWND());
        }
    }
}
