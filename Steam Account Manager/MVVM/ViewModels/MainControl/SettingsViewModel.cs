using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal class SettingsViewModel : ObservableObject
    {
        private bool _isCryptoKeyReset = false;

        private Account _autoLoginAccount;


        string _webApiKey,
               _encryptingKey,
               _password;

        public RelayCommand SaveChangesCommand { get; private set; }
        public RelayCommand OpenApiKeyUrlCommand { get; private set; }
        public RelayCommand GenerateCryptoKeyCommand { get; private set; }
        public RelayCommand ResetCryptoKeyCommand { get; private set; }
        public RelayCommand ChangeOrAddPasswordCommand { get; private set; }
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
                    _autoLoginAccount = value;
                    OnPropertyChanged(nameof(AutoLoginAccount));
                }
            }
        }

        public bool MinimizeOnStart
        {
            get => Config.Properties.MinimizeOnStart;
            set => Config.Properties.MinimizeOnStart = value;
        }

        private bool _autostartup;
        public bool Autostartup
        {
            get => _autostartup;
            set => SetProperty(ref _autostartup, value);
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

        private bool _passwordError;
        public bool PasswordError
        {
            get => _passwordError;
            set => SetProperty(ref _passwordError, value);
        }
        public string Password
        {
            get => _password;
            set => SetProperty(ref _password, value);
        }

        private bool _passwordEnabled;
        public bool PasswordEnabled
        {
            get => _passwordEnabled;
            set
            {
                PasswordError = false;
                _passwordEnabled = value;
                OnPropertyChanged(nameof(PasswordEnabled));
            }
        }

        public string EncryptingKey
        {
            get => _encryptingKey;
            set
            {
                _encryptingKey = value;
                OnPropertyChanged(nameof(EncryptingKey));
            }
        }

        public bool TakeAccountInfoMode
        {
            get => Config.Properties.TakeAccountInfo;
            set => Config.Properties.TakeAccountInfo = value;
        }

        public string WebApiKey           => Config.Properties.WebApiKey;
        public byte SelectedThemeIndex    => (byte)Config.Properties.Theme;
        public byte SelectedLanguageIndex => (byte)Config.Properties.Language;
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

        public string Version
        {
            get => App.Version.ToString("# # #").Replace(' ','.');
        }


        #endregion

        private static bool? OpenAuthWindow()
        {
            var authenticationWindow = new AuthenticationWindow(false)
            {
                Owner = App.MainWindow,
                WindowStartupLocation = System.Windows.WindowStartupLocation.CenterOwner
            };
            return authenticationWindow.ShowDialog();
        }



        public SettingsViewModel()
        {
            Autostartup          = Utils.Common.IsRegistryAutoStartup();
            

            if (!String.IsNullOrEmpty(Config.Properties.Password))
                _passwordEnabled = true;

            EncryptingKey = Config.Properties.UserCryptoKey == Config.GetDefaultCryptoKey ? "By default" : Config.Properties.UserCryptoKey;


            SaveChangesCommand = new RelayCommand(o =>
            {
                if (!String.IsNullOrEmpty(Password) && (Password.Length < 5 || Password.Length > 30))
                {
                    PasswordError = true;
                }
                else
                {
                    Config.Properties.AutoLoginUserID  = AutoLoginAccount?.SteamId64;

                    Utils.Common.SetRegistryAutostartup(Autostartup);


                    if (!String.IsNullOrEmpty(Password))
                        Config.Properties.Password = Utils.Common.Sha256(Password + Config.GetDefaultCryptoKey);
                    else if (_passwordEnabled == false)
                        Config.Properties.Password = null;

                    if ((EncryptingKey != "By default" && EncryptingKey != Config.Properties.UserCryptoKey) || _isCryptoKeyReset)
                    {

                        var recentlyUsers = App.WorkingDirectory + "\\RecentlyLoggedUsers.dat";
                        if (System.IO.File.Exists(recentlyUsers))
                        {
                           var users = Config.Deserialize(recentlyUsers, Config.Properties.UserCryptoKey) as ObservableCollection<RecentlyLoggedAccount>;
                           Config.Serialize(users, recentlyUsers, _isCryptoKeyReset ? Config.GetDefaultCryptoKey : EncryptingKey);
                        }

                        Config.Properties.UserCryptoKey = _isCryptoKeyReset ? Config.GetDefaultCryptoKey : EncryptingKey;
                        if (System.IO.File.Exists(App.WorkingDirectory + "\\database.dat"))
                            Config.SaveAccounts();

                    }
                    Config.SaveProperties();

                    _isCryptoKeyReset = PasswordError = false;
                    Themes.Animations.ShakingAnimation(o as System.Windows.FrameworkElement, true);
                }

            });

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

            GenerateCryptoKeyCommand = new RelayCommand(o =>
            {
                EncryptingKey = Utils.Common.GenerateCryptoKey();
            });

            ResetCryptoKeyCommand = new RelayCommand(o =>
            {
                _isCryptoKeyReset = true;
                EncryptingKey = "By default";
            });

            ChangeOrAddPasswordCommand = new RelayCommand(o =>
            {
                System.Windows.Controls.StackPanel stackPanel = (System.Windows.Controls.StackPanel)o;

                if (Config.Properties.Password == null)
                {
                    if (PasswordEnabled)
                    {
                        PasswordEnabled = false;
                        stackPanel.Visibility = System.Windows.Visibility.Collapsed;
                    }
                    else
                    {
                        PasswordEnabled = true;
                        stackPanel.Visibility = System.Windows.Visibility.Visible;
                    }
                }
                else
                {
                    PasswordEnabled = true;
                    if (OpenAuthWindow() == true)
                    {
                        PasswordEnabled = false;
                        stackPanel.Visibility = System.Windows.Visibility.Visible;
                    }
                }
            });

            ClearAutoLoginAccount = new RelayCommand(o =>
            {
                _autoLoginAccount = null;
                OnPropertyChanged(nameof(AutoLoginAccount));
            });
        }
    }
}
