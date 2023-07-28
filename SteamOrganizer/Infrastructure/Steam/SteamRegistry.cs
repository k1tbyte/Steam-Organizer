using SteamOrganizer.Helpers;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SteamOrganizer.Infrastructure.Steam
{
    internal static class SteamRegistry
    {
        internal static ulong GetActiveUserSteamID()
        {
            var user = Utils.GetUserRegistryValue(@"Software\\Valve\\Steam\\ActiveProcess", "ActiveUser");

            if (user == null)
                return 0u;

           return SteamIdConverter.SteamID64Indent + Convert.ToUInt32(user);
        }

        internal static void SetActiveUserLogin(string login)
            => Utils.SetUserRegistryValue(@"Software\\Valve\\Steam", "AutoLoginUser", login, Microsoft.Win32.RegistryValueKind.String);

        internal static string GetActiveUserLogin()
            => Utils.GetUserRegistryValue(@"Software\\Valve\\Steam", "AutoLoginUser") as string;

        internal static string GetSteamExePath()
            => Utils.GetUserRegistryValue(@"Software\\Valve\\Steam", "SteamExe") as string;

        internal static async Task<bool> ShutdownSteam(int maxAttempts = 15,string exePath = null)
        {
            if (Process.GetProcessesByName("Steam")?.Length == 0)
                return true;

            exePath = exePath ?? GetSteamExePath();

            if (string.IsNullOrEmpty(exePath))
                return false;

            Utils.StartProcess(exePath, "-shutdown");

            for (int i = 0; i < maxAttempts; i++)
            {
                await Task.Delay(1000);
                if (Process.GetProcessesByName("Steam")?.Length == 0)
                    return true;
            }
            
            return false;
        }
    }
}
