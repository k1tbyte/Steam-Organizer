using Microsoft.Win32;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Synchronization;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Extensions;
using SteamOrganizer.Storages;
using System;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class SettingsViewModel : ObservableObject
    {
        public RelayCommand SetupPinCodeCommand { get; private set; }
        public RelayCommand LoginWithGoogleCommand { get; private set; } 
        public RelayCommand LogoutGoogleCommand { get; private set; }

        private const string RegistryAutoStartup = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run";

        private CancellationTokenSource _googleAuthToken;
        public CancellationTokenSource GoogleAuthToken
        {
            get => _googleAuthToken;
            set
            {
                if(value == null)
                {
                    if (_googleAuthToken == null)
                        return;

                    if(!_googleAuthToken.IsCancellationRequested)
                        _googleAuthToken.Cancel();

                    _googleAuthToken.Dispose();
                }
                SetProperty(ref _googleAuthToken, value);
            }
        }

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
            App.MainWindowVM.OpenPinPopup(OnFinalizing, true, Config.PinCodeKey != null);
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

        private async void OnLoginWithGoogle(object param)
        {
            if(GoogleAuthToken != null)
            {
                GoogleAuthToken = null;
                return;
            }

            GoogleAuthToken = new CancellationTokenSource(TimeSpan.FromMinutes(1));

            if(await GDriveManager.AuthorizeAsync(GoogleAuthToken.Token) != null)
            {
                PushNotification.Open("You have successfully linked your Google account to Steam organizer");
                OnPropertyChanged(nameof(Config));
            }

            GoogleAuthToken = null;
        }

        private void OnLogoutGoogle(object param)
        {
            GDriveManager.LogOut();
            OnPropertyChanged(nameof(Config));
            System.Diagnostics.Process.Start("https://myaccount.google.com/u/2/connections?filters=3").Dispose();
        }

        public SettingsViewModel()
        {
            SetupPinCodeCommand    = new RelayCommand(OnSetupingPinCode);
            LoginWithGoogleCommand = new RelayCommand(OnLoginWithGoogle);
            LogoutGoogleCommand    = new RelayCommand(OnLogoutGoogle);
        }
    }
}
