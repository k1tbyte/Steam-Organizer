using System;
using System.Windows;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;
using Steam_Account_Manager.Infrastructure;
using System.Net;

namespace Steam_Account_Manager.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public static RelayCommand CloseCommand { get; set; }
        public static RelayCommand MinimizeCommand { get; set; }
        public static RelayCommand AccountsViewCommand { get; set; }
        public static RelayCommand SettingsViewCommand { get; set; }


        public AccountsViewModel AccountsVM;
        public SettingsViewModel SettingsVM;

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

        public static event EventHandler NotifycationContentChanged;
        private static string _notifycationContent;
        public static string NotifycationContent
        {
            get { return _notifycationContent; }
            set
            {
                _notifycationContent = value;
                NotifycationContentChanged?.Invoke(null, EventArgs.Empty);
            }
        }


        private object _CurrentView;
        public object CurrentView
        {
            get { return _CurrentView; }
            set
            {
                _CurrentView = value;
                OnPropertyChanged();
            }
        }


        private WindowState _MainWindowState;

        public WindowState MainWindowState
        {
            get { return _MainWindowState; }
            set
            {
                _MainWindowState = value;
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
            AccountsVM = new AccountsViewModel();
            SettingsVM = new SettingsViewModel();

            CurrentView = AccountsVM;

            AccountsViewCommand = new RelayCommand(o =>
            {
                CurrentView = AccountsVM;
            });

            SettingsViewCommand = new RelayCommand(o =>
            {
                CurrentView = SettingsVM;
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
