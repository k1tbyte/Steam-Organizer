using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.ViewModels.RemoteControl;
using Steam_Account_Manager.ViewModels.View;
using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public static RelayCommand CloseCommand { get; set; }
        public static RelayCommand MinimizeCommand { get; set; }
        public static RelayCommand AccountsViewCommand { get; set; }
        public static RelayCommand SettingsViewCommand { get; set; }
        public static RelayCommand AccountDataViewCommand { get; set; }
        public static RelayCommand RemoteControlViewCommand { get; set; }
        public static RelayCommand NoLoadUpdateCommand { get; set; }
        public static RelayCommand YesLoadUpdateCommand { get; set; }
        public RelayCommand LogoutCommand { get; set; }

        public AccountsViewModel AccountsVm;
        public SettingsViewModel SettingsVm;
        public MainRemoteControlViewModel RemoteControlVm;
        public AccountDataView AccountDataV;

        public static event EventHandler TotalAccountsChanged;
        public static event EventHandler NowLoginUserImageChanged;
        public static event EventHandler NowLoginUserNicknameChanged;
        private static int _totalAccounts;
        private static string _nowLoginUserImage, _nowLoginUserNickname;
        private bool _updateDetect, _showInTaskbar;
        private WindowState _windowState;

        public WindowState WindowState
        {
            get => _windowState;
            set
            {

                ShowInTaskbar = value == WindowState.Minimized;
                Set(ref _windowState, value);

            }
        }

        public bool ShowInTaskbar
        {
            get => _showInTaskbar;
            set
            {
                _showInTaskbar = value;
                OnPropertyChanged(nameof(ShowInTaskbar));
            }
        }

        public bool UpdateDetect
        {
            get => _updateDetect;
            set
            {
                _updateDetect = value;
                OnPropertyChanged(nameof(UpdateDetect));
            }
        }

        public static string NowLoginUserNickname
        {
            get => _nowLoginUserNickname;
            set
            {
                _nowLoginUserNickname = value;
                NowLoginUserNicknameChanged?.Invoke(null, EventArgs.Empty);
            }
        }
        public static string NowLoginUserImage
        {
            get => _nowLoginUserImage;
            set
            {
                _nowLoginUserImage = value;
                NowLoginUserImageChanged?.Invoke(null, EventArgs.Empty);
            }
        }
        public static int TotalAccounts
        {
            get { return _totalAccounts; }
            set
            {
                _totalAccounts = value;
                TotalAccountsChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public static event EventHandler NotificationVisibleChanged;
        private static bool _notificationVisible = false;
        public static bool NotificationVisible
        {
            get { return _notificationVisible; }
            set
            {
                _notificationVisible = value;
                NotificationVisibleChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public static event EventHandler NotificationContentChanged;
        private static string _notificationContent;
        public static string NotificationContent
        {
            get { return _notificationContent; }
            set
            {
                _notificationContent = value;
                NotificationContentChanged?.Invoke(null, EventArgs.Empty);
            }
        }
        public static event EventHandler UpdatedAccountIndexChanged;
        private static int _updatedAccountIndex;
        public static int UpdatedAccountIndex
        {
            get => _updatedAccountIndex;
            set
            {
                _updatedAccountIndex = value;
                UpdatedAccountIndexChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public static event EventHandler IsEnabledForUserChanged;
        private static bool _isEnabledForUser = true;
        public static bool IsEnabledForUser
        {
            get => _isEnabledForUser;
            set
            {
                _isEnabledForUser = value;
                IsEnabledForUserChanged?.Invoke(null, EventArgs.Empty);
            }
        }


        private object _currentView;
        public object CurrentView
        {
            get { return _currentView; }
            set
            {
                _currentView = value;
                OnPropertyChanged();
            }
        }


        public static async Task<bool> NowLoginUserParse(ushort awaitingMs = 0)
        {
            bool accountDetected = false;
            await Task.Factory.StartNew(() =>
            {
                if (awaitingMs != 0) Thread.Sleep(awaitingMs);
                var steamID = Utilities.GetSteamRegistryActiveUser();
                if (steamID != 0)
                {
                    NowLoginUserImage = Utilities.GetSteamAvatarUrl((ulong)(steamID + 76561197960265728)) ?? "/Images/user.png";
                    NowLoginUserNickname = Utilities.GetSteamNickname((ulong)(steamID + 76561197960265728)) ?? "Username";
                    accountDetected = true;
                }
                else
                {
                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });
            return accountDetected;
        }

        private async Task CheckingUpdates()
        {
            await Task.Factory.StartNew(() =>
            {
                try
                {
                    var webClient = new WebClient();
                    var version = webClient.DownloadString("https://raw.githubusercontent.com/Explynex/Steam_Account_Manager/master/VERSION.md").Replace(".", String.Empty);
                    if (uint.Parse(version) > App.Version)
                    {
                        UpdateDetect = true;
                    }
                }
                catch { }
            });
        }

        public MainWindowViewModel()
        {
            AccountsVm = new AccountsViewModel();
            SettingsVm = new SettingsViewModel();
            RemoteControlVm = new MainRemoteControlViewModel();

            CurrentView = AccountsVm;

            _ = NowLoginUserParse().ConfigureAwait(false);
            _ = CheckingUpdates().ConfigureAwait(false);

            AccountsViewCommand = new RelayCommand(o =>
            {
                if (o != null && (bool)o == true)
                {
                    AccountDataV = null;
                }
                CurrentView = AccountsVm;
            });

            SettingsViewCommand = new RelayCommand(o =>
            {
                CurrentView = SettingsVm;
            });

            AccountDataViewCommand = new RelayCommand(o =>
            {
                AccountDataV = new AccountDataView((int)o);
                CurrentView = AccountDataV;
            });

            RemoteControlViewCommand = new RelayCommand(o =>
            {
                CurrentView = RemoteControlVm;
            });

            CloseCommand = new RelayCommand(o =>
            {
                if (Config.Properties.MinimizeToTray)
                {
                    ShowInTaskbar = false;
                    WindowState = WindowState.Minimized;
                    return;
                }

                App.Shutdown();
            });

            MinimizeCommand = new RelayCommand(o =>
            {
                WindowState = WindowState.Minimized;
            });

            LogoutCommand = new RelayCommand(o =>
            {
                if (NowLoginUserNickname != "Username")
                {
                    Utilities.KillSteamProcess();

                    if (!String.IsNullOrEmpty(Utilities.GetSteamRegistryRememberUser()))
                    {
                        Utilities.SetSteamRegistryRememberUser(String.Empty);
                    }

                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });

            YesLoadUpdateCommand = new RelayCommand(o =>
            {
                System.Diagnostics.Process updater = new System.Diagnostics.Process();

                updater.StartInfo.FileName = @".\UpdateManager.exe";
                updater.StartInfo.Arguments = "Upd";
                updater.Start();

                App.Shutdown();
            });

            NoLoadUpdateCommand = new RelayCommand(o =>
            {
                UpdateDetect = false;
            });


        }
    }
}
