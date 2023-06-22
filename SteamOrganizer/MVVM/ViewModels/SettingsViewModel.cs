using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Utils;
using System;
using System.Collections.ObjectModel;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class SettingsViewModel : ObservableObject
    {
        private Account _autoLoginAccount;

        public RelayCommand OpenApiKeyUrlCommand { get; private set; }
        public RelayCommand ClearAutoLoginAccount { get; private set; }
        public RelayCommand ChangeThemeCommand { get; private set; }
        public RelayCommand ChangeLanguageCommand { get; private set; }


        #region Properties
        public ObservableCollection<Account> AutoLoginUsers => Config.Accounts;
        public ConfigProperties Properties  => Config.Properties;
        public Account AutoLoginAccount
        {
            get => _autoLoginAccount;
            set
            {
                if ((value is Account acc && (acc.SteamId64 != Config.Properties.AutoLoginUserID || _autoLoginAccount == null)) || value == null)
                {
                    Config.Properties.AutoLoginUserID = value == null ? null : (value as Account).SteamId64;
                    SetProperty(ref _autoLoginAccount, value);
                }
            }
        }


        public bool Autostartup
        {
            get => Utils.Common.IsRegistryAutoStartup();
            set => Utils.Common.SetRegistryAutostartup(value);
        }

        private bool _passwordError;
        public bool PasswordError
        {
            get => _passwordError;
            set => SetProperty(ref _passwordError, value);
        }

        private string _password;
        public string Password
        {
            get => _password;
            set
            {
                PasswordError = value?.Length > 30 || value?.Length < 5;
                SetProperty(ref _password, value);
            }
        }

        public byte ActionAfterLogin
        {
            get => (byte)Config.Properties.ActionAfterLogin;
            set => Config.Properties.ActionAfterLogin = (LoggedAction)value;
        }

        public string Version => App.Version.ToReadable();
        #endregion

        private async void CheckAutoLoginUser()
        {
            await App.Current.Dispatcher.InvokeAsync(() =>
            {
                if (Config.Properties.AutoLoginUserID == null)
                    return;

                var desired = Config.Accounts.Find(o => o.SteamId64.HasValue && o.SteamId64.Value == Config.Properties.AutoLoginUserID.Value);

                if (desired == default(Account))
                {
                    Config.Properties.AutoLoginUserID = null;
                    Config.SaveProperties();
                    return;
                }

                AutoLoginAccount = desired;
              /*  if (!App.OfflineMode) //NEED TO FIX
                    ((App.MainWindow.DataContext as MainWindowViewModel).RemoteControlV.DataContext as RemoteControlViewModel).LoginViewCommand.Execute(desired);*/
            },System.Windows.Threading.DispatcherPriority.Background);
        }

        public SettingsViewModel()
        {
            CheckAutoLoginUser();

            OpenApiKeyUrlCommand = new RelayCommand(o =>
                System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("https://steamcommunity.com/dev/apikey")).Dispose());

            ChangeThemeCommand = new RelayCommand(o =>
            {
                var attachedTheme = (Themes)Convert.ToByte(o);
                if (Config.Properties.Theme != attachedTheme)
                    Config.Properties.Theme = attachedTheme;
            });

            ChangeLanguageCommand = new RelayCommand(o =>
            {
                var attachedLocale = (Languages)Convert.ToByte(o);
                if (Config.Properties.Language == attachedLocale)
                    return;

                Config.Properties.Language = attachedLocale;
                OnPropertyChanged(nameof(ActionAfterLogin));
            });

            ClearAutoLoginAccount = new RelayCommand(o =>
            {
                AutoLoginAccount = null;
            });
        }
    }
}
