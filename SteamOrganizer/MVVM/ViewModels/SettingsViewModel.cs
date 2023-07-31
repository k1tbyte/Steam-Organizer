using Microsoft.Win32;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.Storages;
using System.Reflection;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class SettingsViewModel : ObservableObject
    {
        private const string RegistryAutoStartup = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run";
        public bool Autostartup
        {
            get =>
                !string.IsNullOrEmpty(Utils.GetUserRegistryValue(RegistryAutoStartup, App.Name) as string);

            set
            {
                if(value &&
                    Utils.SetUserRegistryValue(RegistryAutoStartup, App.Name, Assembly.GetExecutingAssembly().Location, RegistryValueKind.String))
                {
                    return;
                }

                Utils.DeleteRegistryValue(RegistryAutoStartup, App.Name);
            }
        }

        public GlobalStorage Config => App.Config;
    }
}
