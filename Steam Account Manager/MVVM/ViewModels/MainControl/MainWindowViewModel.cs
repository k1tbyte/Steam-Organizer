using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.MainControl.Controls;
using Steam_Account_Manager.MVVM.View.RemoteControl.Controls;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
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

        public AccountsView AccountsV;
        public SettingsView SettingsV;
        public MainRemoteControlView RemoteControlV;
        public AccountDataView AccountDataV;

        public static event EventHandler TotalAccountsChanged;
        public static event EventHandler NowLoginUserImageChanged;
        public static event EventHandler NowLoginUserNicknameChanged;
        public static bool CancellationFlag = false;
        private static string _nowLoginUserImage = "/Images/user.png", _nowLoginUserNickname = "Username";
        private bool _updateDetect;
        private WindowState _windowState;

        #region Properties
        public WindowState WindowState
        {
            get => _windowState;
            set => SetProperty(ref _windowState, value);
        }

        public bool UpdateDetect
        {
            get => _updateDetect;
            set => SetProperty(ref _updateDetect, value);
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
        public int TotalAccounts
        {
            get => Config.Accounts.Count;
            set => OnPropertyChanged(nameof(TotalAccounts));
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

        private object _currentView;
        public object CurrentView
        {
            get => _currentView;
            set => SetProperty(ref _currentView, value);
        } 
        #endregion

        private static bool IsParsing = false;
        public static async Task<bool> NowLoginUserParse(ushort awaitingMs = 0)
        {
            if (IsParsing) 
                return false;
            IsParsing = true;
            bool accountDetected = false;
            await Task.Factory.StartNew(() =>
            {
                Thread.Sleep(awaitingMs);
                var steamID = Utils.Common.GetSteamRegistryActiveUser();
                if (steamID != 0)
                {
                    NowLoginUserImage = Utils.Common.GetSteamAvatarUrl(steamID + 76561197960265728UL) ?? "/Images/user.png";
                    NowLoginUserNickname = Utils.Common.GetSteamNickname(steamID + 76561197960265728UL) ?? "Username";
                    accountDetected = true;
                }
                else if(awaitingMs != 0)
                {
                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });
            IsParsing = false;
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

            AccountsV      = new AccountsView();
            AccountDataV   = new AccountDataView();
            RemoteControlV = new MainRemoteControlView();
            SettingsV      = new SettingsView();

            CurrentView = AccountsV;

            _ = NowLoginUserParse().ConfigureAwait(false);
            _ = CheckingUpdates().ConfigureAwait(false);

            AccountsViewCommand = new RelayCommand(o =>  CurrentView = AccountsV);

            SettingsViewCommand = new RelayCommand(o => 
            {
                CurrentView = SettingsV;
            });

            MinimizeCommand     = new RelayCommand(o => WindowState = WindowState.Minimized);

            NoLoadUpdateCommand = new RelayCommand(o => UpdateDetect = false);

            AccountDataViewCommand = new RelayCommand(o =>
            {
                AccountDataV.DataContext = new AccountDataViewModel((Account)o);
                CurrentView = AccountDataV;
            });

            RemoteControlViewCommand = new RelayCommand(o =>
            {
                App.MainWindow.RemoteControlMenu.IsChecked = true;
                CurrentView = RemoteControlV;
            });

            CloseCommand = new RelayCommand(o =>
            {
                if (Config.Properties.MinimizeToTray)
                {
                    App.MainWindow.Hide();
                    return;
                }

                App.Shutdown();
            });

            LogoutCommand = new RelayCommand(o =>
            {
                if (NowLoginUserNickname != "Username")
                {
                    Utils.Common.KillSteamProcess();

                    if (!String.IsNullOrEmpty(Utils.Common.GetSteamRegistryRememberUser()))
                    {
                        Utils.Common.SetSteamRegistryRememberUser(String.Empty);
                    }

                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });

            YesLoadUpdateCommand = new RelayCommand(o =>
            {
                using (System.Diagnostics.Process updater = new System.Diagnostics.Process())
                {
                    updater.StartInfo.FileName = $"{App.WorkingDirectory}\\UpdateManager.exe";
                    updater.StartInfo.Arguments = "/upd";
                    updater.Start();
                }

                App.Shutdown();
            });
        }
    }
}
