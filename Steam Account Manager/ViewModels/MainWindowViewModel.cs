using System;
using System.Windows;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;
using Steam_Account_Manager.Infrastructure;
using System.Net;
using Steam_Account_Manager.ViewModels.View;
using System.Threading.Tasks;
using System.Threading;

namespace Steam_Account_Manager.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public static RelayCommand CloseCommand { get; set; }
        public static RelayCommand MinimizeCommand { get; set; }
        public static RelayCommand AccountsViewCommand { get; set; }
        public static RelayCommand SettingsViewCommand { get; set; }
        public static RelayCommand AccountDataViewCommand { get; set; }
        public RelayCommand LogoutCommand { get; set; }


        public AccountsViewModel AccountsVm;
        public SettingsViewModel SettingsVm;
        public AccountDataView AccountDataV; 

        public static event EventHandler TotalAccountsChanged;
        private static int _totalAccounts;
        private string _nowLoginUserImage, _nowLoginUserNickname;
        public string NowLoginUserNickname
        {
            get => _nowLoginUserNickname;
            set
            {
                _nowLoginUserNickname = value;
                OnPropertyChanged(nameof(NowLoginUserNickname));
            }
        }
        public string NowLoginUserImage
        {
            get => _nowLoginUserImage;
            set
            {
                _nowLoginUserImage = value;
                OnPropertyChanged(nameof(NowLoginUserImage));
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
        private async Task NowLoginUserParse()
        {
            await Task.Factory.StartNew(() =>
            {
                try
                {
                    var steamID = Utilities.GetSteamRegistryActiveUser();
                    var steamParser = new Infrastructure.Parsers.SteamParser(Utilities.SteamId32ToSteamId64(steamID));
                    steamParser.ParsePlayerSummariesAsync().GetAwaiter().GetResult();
                    NowLoginUserImage = steamParser.GetAvatarUrlFull;
                    NowLoginUserNickname = steamParser.GetNickname;
                }
                catch
                {
                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });
        }

        public MainWindowViewModel()
        {
            AccountsVm = new AccountsViewModel();
            SettingsVm = new SettingsViewModel();

            CurrentView = AccountsVm;

            NowLoginUserParse();

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

            CloseCommand = new RelayCommand(o =>
            {
                Application.Current.Shutdown();   
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

        }
    }
}
