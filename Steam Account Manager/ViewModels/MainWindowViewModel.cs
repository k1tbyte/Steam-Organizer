using System;
using System.Windows;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;
using Steam_Account_Manager.Infrastructure;
using System.Net;
using Steam_Account_Manager.ViewModels.View;

namespace Steam_Account_Manager.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public static RelayCommand CloseCommand { get; set; }
        public static RelayCommand MinimizeCommand { get; set; }
        public static RelayCommand AccountsViewCommand { get; set; }
        public static RelayCommand SettingsViewCommand { get; set; }
        public static RelayCommand AccountDataViewCommand { get; set; }


        public AccountsViewModel AccountsVm;
        public SettingsViewModel SettingsVm;
        public AccountDataView AccountDataV; 

        public static event EventHandler TotalAccountsChanged;
        private static int _totalAccounts;
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

        public static bool NetworkConnectivityCheck()
        {
            try
            {
                var client = new WebClient();
                var stream = client.OpenRead("http://www.google.com");
                return true;
            }
            catch
            {
                return false;
            }
        }

        public MainWindowViewModel()
        {
            AccountsVm = new AccountsViewModel();
            SettingsVm = new SettingsViewModel();

            CurrentView = AccountsVm;

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
                AccountDataV = new AccountDataView();
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


        }
    }
}
