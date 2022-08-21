using System;
using Steam_Account_Manager.Infrastructure;

namespace Steam_Account_Manager.ViewModels
{
    internal class SettingsViewModel : ObservableObject
    {
        private bool[] _themeMode = { true, false, false };
        private bool[] _localeMode = { true, false, false };
        private bool _autoCloseMode, _noConfirmMode, _takeAccountInfoMode, _passwordEnabled;
        private string _webApiKey;
        private string _encryptingKey;
        private bool _apiKeyError, _passwordError;
        private string _password;
        public RelayCommand SaveChangesCommand { get; set; }
        public RelayCommand OpenApiKeyUrlCommand { get; set; }
        public RelayCommand GenerateCryptoKeyCommand { get; set; }
        public RelayCommand ResetCryptoKeyCommand { get; set; }
        public RelayCommand ChangeOrAddPasswordCommand { get; set; }

        public bool PasswordError
        {
            get => _passwordError;
            set
            {
                _passwordError = value;
                OnPropertyChanged(nameof(PasswordError));
            }
        }
        public string Password
        {
            get => _password;
            set
            {
                _password = value;
                OnPropertyChanged(nameof(Password));
            }
        }
        public bool PasswordEnabled
        {
            get => _passwordEnabled;
            set
            {
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
        public bool ApiKeyError
        {
            get => _apiKeyError;
            set
            {
                _apiKeyError = value;
                OnPropertyChanged(nameof(ApiKeyError));
            }
        }
        public string WebApiKey
        {
            get => _webApiKey;
            set
            {
                _webApiKey = value;
                OnPropertyChanged(nameof(WebApiKey));
            }
        }
        public bool TakeAccountInfoMode
        {
            get => _takeAccountInfoMode;
            set
            {
                _takeAccountInfoMode = value;
                OnPropertyChanged(nameof(TakeAccountInfoMode));
            }
        }

        public bool[] LocaleMode
        {
            get => _localeMode;
            set
            {
                _localeMode = value;
                OnPropertyChanged();
            }
        }

        public bool[] ThemeMode
        {
            get => _themeMode;
            set
            {
                _themeMode = value;
                OnPropertyChanged();
            }
        }

        public bool AutoCloseMode
        {
            get => _autoCloseMode;
            set
            {
                _autoCloseMode = value;
                OnPropertyChanged(nameof(AutoCloseMode));
            }
        }

        public bool NoConfirmMode
        {
            get => _noConfirmMode;
            set
            {
                _noConfirmMode = value;
                OnPropertyChanged(nameof(NoConfirmMode));
            }
        }

        private static bool? OpenAuthWindow()
        {
            var authenticationWindow = new View.AuthenticationWindow(false);
            authenticationWindow.Owner = App.Current.MainWindow;
            authenticationWindow.WindowStartupLocation = System.Windows.WindowStartupLocation.CenterOwner;
            return authenticationWindow.ShowDialog();
        }

        public SettingsViewModel()
        {
            var config = Config.GetInstance();

            NoConfirmMode = config.NoConfirmMode;
            AutoCloseMode = config.AutoClose;
            TakeAccountInfoMode = config.TakeAccountInfo;
            WebApiKey = config.WebApiKey;
            if (Config._config.Password != null) _passwordEnabled = true;
            
            EncryptingKey = config.UserCryptoKey == Config.GetDefaultCryptoKey ? "By default" : config.UserCryptoKey;
            #region Считывание языка
            for (int i = 0; i < 3; i++)
                LocaleMode[i] = false;
            if (config.Language == config.SupportedLanguages[(int)Config.Languages.English] || config.Language == null)
                LocaleMode[0] = true;
            else if (config.Language == config.SupportedLanguages[(int)Config.Languages.Russian])
                LocaleMode[1] = true;
            else if (config.Language == config.SupportedLanguages[(int)Config.Languages.Ukrainian])
                LocaleMode[2] = true; 
            #endregion

            #region Считывание темы

            for (int i = 0; i < 3; i++)
                ThemeMode[i] = false;
            if (config.Theme == Config.Themes.Dark)
                ThemeMode[0] = true;
            else if (config.Theme == Config.Themes.Light)
                ThemeMode[1] = true;
            else if (config.Theme == Config.Themes.Nebula)
                ThemeMode[2] = true;
            
            #endregion


            SaveChangesCommand = new RelayCommand(o =>
            {

                if(WebApiKey.Length < 32 && WebApiKey != "")
                {
                    ApiKeyError = true;
                }
                else if(Password != null && Password != "" && ( Password.Length < 5 || Password.Length > 30))
                {
                    PasswordError = true;
                }
                else
                {
                    byte i = 0;
                    for (; ; i++)
                        if (ThemeMode[i])
                        {
                            config.Theme = config.SupportedThemes[Convert.ToInt32(i)];
                            break;
                        }

                    for (i = 0; ; i++)
                        if (LocaleMode[i])
                        {
                            config.Language = config.SupportedLanguages[Convert.ToInt32(i)];
                            break;
                        }
                    config.NoConfirmMode = NoConfirmMode;
                    config.AutoClose = AutoCloseMode;
                    config.TakeAccountInfo = TakeAccountInfoMode;
                    config.WebApiKey = WebApiKey;
                    if (Password != null && Password != "")
                        config.Password = Config.Sha256(Password + Config.GetDefaultCryptoKey);
                    else if(_passwordEnabled == false) config.Password = null;

                    if(EncryptingKey != "By default")
                    {
                        config.UserCryptoKey = EncryptingKey;
                        Config._config.UserCryptoKey = EncryptingKey;
                        if (System.IO.File.Exists("database.dat"))
                            CryptoBase._database.SaveDatabase();
                    }
                    else
                    {
                        config.UserCryptoKey = Config.GetDefaultCryptoKey;
                        if(System.IO.File.Exists("database.dat")) 
                            CryptoBase._database.SaveDatabase();
                        EncryptingKey = "By default";
                    }

                    config.SaveChanges();
                    ApiKeyError = false;
                    PasswordError = false;

                }

            });
            
            OpenApiKeyUrlCommand = new RelayCommand(o =>
            {
                using (System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("https://steamcommunity.com/dev/apikey")
                {
                    UseShellExecute = true
                })) {; }
            });

            GenerateCryptoKeyCommand = new RelayCommand(o =>
            {
                EncryptingKey = Config.GenerateCryptoKey();
            });

            ResetCryptoKeyCommand = new RelayCommand(o =>
            {
                EncryptingKey = "By default";
            });

            ChangeOrAddPasswordCommand = new RelayCommand(o =>
            {
                System.Windows.Controls.StackPanel stackPanel = (System.Windows.Controls.StackPanel)o;

                if (Config._config.Password == null)
                {
                    if (PasswordEnabled)
                    {
                        PasswordEnabled = false;
                        stackPanel.Visibility = System.Windows.Visibility.Hidden;
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
        }
    }
}
