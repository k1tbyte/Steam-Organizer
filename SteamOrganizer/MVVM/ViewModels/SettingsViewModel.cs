using Microsoft.Win32;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.Storages;
using System.Reflection;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class SettingsViewModel : ObservableObject
    {
        public RelayCommand SetupPinCodeCommand { get; private set; }

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

        public bool IsPinCodeEnabled => Config.PinCodeKey != null;
        public string Version => App.Version.ToReadable();

        public GlobalStorage Config => App.Config;

        private void OnSetupingPinCode(object param)
        {
            App.MainWindowVM.OpenPinPopup(OnFinalizing,true);
            return;

            void OnFinalizing(byte[] key)
            {
                if (key != null)
                {
                    Config.PinCodeKey = Config.PinCodeKey == null ? key : null;
                }

                OnPropertyChanged(nameof(IsPinCodeEnabled));
            }
        }

        public SettingsViewModel()
        {
            SetupPinCodeCommand = new RelayCommand(OnSetupingPinCode);
        }
    }
}
