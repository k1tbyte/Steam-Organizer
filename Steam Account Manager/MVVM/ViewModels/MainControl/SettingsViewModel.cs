using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using Steam_Account_Manager.MVVM.Core;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal class SettingsViewModel : ObservableObject
    {
        private Account _autoLoginAccount;

        public RelayCommand OpenApiKeyUrlCommand { get; private set; }
        public RelayCommand ClearAutoLoginAccount { get; private set; }
        public RelayCommand ChangeThemeCommand { get; private set; }
        public RelayCommand ChangeLanguageCommand { get; private set; }


        #region Properties
        public List<Account> AutoLoginUsers => Config.Accounts.Where(o => o.ContainParseInfo).ToList();
        
        public Account AutoLoginAccount
        {
            get => _autoLoginAccount;
            set
            {
                if (value is Account acc && acc != null && (acc.SteamId64 != Config.Properties.AutoLoginUserID || _autoLoginAccount == null))
                {
                    Config.Properties.AutoLoginUserID = acc.SteamId64;
                    SetProperty(ref _autoLoginAccount, value);
                }
            }
        }

        public bool MinimizeOnStart
        {
            get => Config.Properties.MinimizeOnStart;
            set => Config.Properties.MinimizeOnStart = value;
        }

        public bool Autostartup
        {
            get => Utils.Common.IsRegistryAutoStartup();
            set => Utils.Common.SetRegistryAutostartup(Autostartup);
        }

        public bool MinimizeToTray
        {
            get => Config.Properties.MinimizeToTray;
            set => Config.Properties.MinimizeToTray = value;
        }

        public bool RememberPassword
        {
            get => Config.Properties.RememberPassword;
            set => Config.Properties.RememberPassword = value;

        }

        public bool AutoGetSteamId
        {
            get => Config.Properties.AutoGetSteamId; 
            set => Config.Properties.AutoGetSteamId = value;
        }

        public bool TakeAccountInfoMode
        {
            get => Config.Properties.TakeAccountInfo;
            set => Config.Properties.TakeAccountInfo = value;
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

        public byte TwoFactorInputMethod
        {
            get => (byte)Config.Properties.Input2FaMethod;
            set => Config.Properties.Input2FaMethod = (Input2faMethod)value;
        }

        public bool NoConfirmMode
        {
            get => Config.Properties.NoConfirmMode;
            set => Config.Properties.NoConfirmMode = value;
        }

        public bool HighestQualityImages
        {
            get => Config.Properties.HighestQualityImages;
            set => Config.Properties.HighestQualityImages = value;
        }

        public string Version             => App.Version.ToString("# # #").Replace(' ', '.');
        public string WebApiKey           => Config.Properties.WebApiKey;
        public byte SelectedThemeIndex    => (byte)Config.Properties.Theme;
        public byte SelectedLanguageIndex => (byte)Config.Properties.Language;
        #endregion

        public SettingsViewModel()
        {   
            OpenApiKeyUrlCommand = new RelayCommand(o =>
            {
                using (System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("https://steamcommunity.com/dev/apikey"))) { };
            });

            ChangeThemeCommand = new RelayCommand(o =>
            {
                var attachedTheme = (Infrastructure.Models.Themes)Convert.ToByte(o);
                if (Config.Properties.Theme != attachedTheme)
                    Config.Properties.Theme = attachedTheme;
            });

            ChangeLanguageCommand = new RelayCommand(o =>
            {
                var attachedLocale = (Infrastructure.Models.Languages)Convert.ToByte(o);
                if (Config.Properties.Language == attachedLocale)
                    return;

                Config.Properties.Language = attachedLocale;
                OnPropertyChanged(nameof(ActionAfterLogin));
                OnPropertyChanged(nameof(TwoFactorInputMethod));
            });

            ClearAutoLoginAccount = new RelayCommand(o =>
            {
                _autoLoginAccount = null;
                OnPropertyChanged(nameof(AutoLoginAccount));
            });
        }
    }
}
