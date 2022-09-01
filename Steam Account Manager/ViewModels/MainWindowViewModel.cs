using System;
using System.Windows;
using Steam_Account_Manager.ViewModels.RemoteControl.View;
using Steam_Account_Manager.ViewModels.RemoteControl;
using Steam_Account_Manager.Infrastructure;
using System.Net;
using Steam_Account_Manager.ViewModels.View;
using System.Threading.Tasks;
using System.Threading;

namespace Steam_Account_Manager.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public static RelayCommand CloseCommand             { get; set; }
        public static RelayCommand MinimizeCommand          { get; set; }
        public static RelayCommand AccountsViewCommand      { get; set; }
        public static RelayCommand SettingsViewCommand      { get; set; }
        public static RelayCommand AccountDataViewCommand   { get; set; }
        public static RelayCommand RemoteControlViewCommand { get; set; }
        public static RelayCommand NoLoadUpdateCommand      { get; set; }
        public static RelayCommand YesLoadUpdateCommand     { get; set; }
        public RelayCommand LogoutCommand { get; set; }

        public AccountsViewModel AccountsVm;
        public SettingsViewModel SettingsVm;
        public MainRemoteControlView RemoteControlV;
        public AccountDataView AccountDataV; 

        public static event EventHandler TotalAccountsChanged;
        public static event EventHandler NowLoginUserImageChanged;
        public static event EventHandler NowLoginUserNicknameChanged;
        private static int _totalAccounts;
        private static string _nowLoginUserImage, _nowLoginUserNickname;
        private bool _updateDetect;

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


        private WindowState _mainWindowState;

        public WindowState MainWindowState
        {
            get { return _mainWindowState; }
            set
            {
                _mainWindowState = value;
                base.OnPropertyChanged("MainWindowState");
            }
        }

        public static async Task NotificationView(string msg)
        {
            NotificationVisible = true;
            NotificationContent = msg;
            Thread.Sleep(2300);
            NotificationVisible = false;
        }
        public static async Task<bool> NowLoginUserParse(ushort awaitingMs=0)
        {
            bool accountDetected = false;
            await Task.Factory.StartNew(() =>
            {
                if (awaitingMs != 0) Thread.Sleep(awaitingMs);
                try
                {
                    var steamID = Utilities.GetSteamRegistryActiveUser();
                    if (steamID == 0) throw (new NullReferenceException());
                    var steamParser = new Infrastructure.Parsers.SteamParser(Utilities.SteamId32ToSteamId64(steamID));
                    steamParser.ParsePlayerSummariesAsync().GetAwaiter().GetResult();
                    NowLoginUserImage = steamParser.GetAvatarUrlFull;
                    NowLoginUserNickname = steamParser.GetNickname;
                    accountDetected = true;
                }
                catch
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
                    var version = webClient.DownloadString("https://raw.githubusercontent.com/Explynex/Steam_Account_Manager/master/VERSION.md").Replace(".",String.Empty);
                    if(uint.Parse(version) > App.Version)
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
            RemoteControlV = new MainRemoteControlView();

            CurrentView = AccountsVm;

            _ = NowLoginUserParse();
            _ = CheckingUpdates();

            AccountsViewCommand = new RelayCommand(o =>
            {
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
                CurrentView = RemoteControlV;
            });

            CloseCommand = new RelayCommand(o =>
            {
                App.Shutdown();
            });

            MinimizeCommand = new RelayCommand(o =>
            {
                MainWindowState = WindowState.Minimized;
            });

            LogoutCommand = new RelayCommand(o =>
            {
                if(NowLoginUserNickname != "Username")
                {
                    Utilities.KillSteamProcess();
                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });

            YesLoadUpdateCommand = new RelayCommand(o =>
            {
                System.Diagnostics.Process updater = new System.Diagnostics.Process();

                updater.StartInfo.FileName = @".\Updater.exe";
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
