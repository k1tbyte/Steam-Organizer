﻿using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.ViewModels
{
    internal class AccountTabViewModel : ObservableObject
    {
        public RelayCommand DeleteAccoundCommand { get; set; }
        public RelayCommand EditOrViewAccountCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }
        public RelayCommand ViewAccountNoteModeCommand { get; set; }
        public AsyncRelayCommand ConnectToSteamCommand { get; set; }

        private string _steamPicture;
        private string _steamNickname;
        private string _steamId, _login, _password;
        private string _steamLevel;
        private int _vacCount;
        private int _id;
        private CryptoBase database;
        private bool _containParseInfo;

        public bool ContainParseInfo
        {
            get => _containParseInfo;
            set
            {
                _containParseInfo = value;
                OnPropertyChanged(nameof(ContainParseInfo));
            }
        }
        public string SteamLevel
        {
            get => _steamLevel;
            set
            {
                _steamLevel = value;
                OnPropertyChanged();
            }
        }

        public string SteamId
        {
            get => _steamId;
            set
            {
                _steamId = value;
                OnPropertyChanged();
            }
        }

        public string SteamPicture
        {
            get => _steamPicture;
            set
            {
                _steamPicture = value;
                OnPropertyChanged();
            }
        }

        public string SteamNickName
        {
            get => _steamNickname;
            set
            {
                _steamNickname = value;
                OnPropertyChanged();
            }
        }

        public int VacCount
        {
            get => _vacCount;
            set
            {
                _vacCount = value;
                OnPropertyChanged();
            }
        }

        public int Id
        {
            get => _id;
            set
            {
                _id = value;
                OnPropertyChanged();
            }
        }
        private async Task ConnectToSteam()
        {
            await Task.Factory.StartNew(() =>
            {
                Config.GetInstance();
                MainWindowViewModel.IsEnabledForUser = false;
                try
                {
                    Utilities.KillSteamAndConnect(Config._config.SteamDirection, "-login " + _login + " " + _password + " -tcp");
                    if (Config._config.AutoClose) Application.Current.Dispatcher.InvokeShutdown();
                    else
                    {
                        _ = MainWindowViewModel.NotificationView("Logged in, wait for steam to start");
                        _ = MainWindowViewModel.NowLoginUserParse(20000);
                    } 
                }
                catch
                {
                    try
                    {
                        Utilities.KillSteamAndConnect(Utilities.GetSteamRegistryDirection(), "-login " + _login + " " + _password + " -tcp");
                        Config._config.SaveChanges();
                        if (Config._config.AutoClose) Application.Current.Dispatcher.InvokeShutdown();
                        else
                        {
                            _ = MainWindowViewModel.NotificationView("Logged in, wait for steam to start");
                            _ = MainWindowViewModel.NowLoginUserParse(20000);
                        } 
                    }
                    catch
                    {
                        _ = MainWindowViewModel.NotificationView("Steam not found or not installed");
                    }
                }
                MainWindowViewModel.IsEnabledForUser = true;
            });
        }

        public AccountTabViewModel(int id)
        {
            database = CryptoBase.GetInstance();
            Account account = database.Accounts.ElementAt(id);
            Id = id + 1;
            ContainParseInfo = account.ContainParseInfo;
            if (account.ContainParseInfo)
            {
                SteamPicture = account.AvatarFull;
                VacCount = account.VacBansCount;
                SteamId = account.SteamId64;
                SteamLevel = account.SteamLevel;
            }
            else
            {
                SteamLevel = "-";
                SteamPicture = "/Images/default_steam_profile.png";
                SteamId = "Unknown";
                VacCount = -1;
            }

            SteamNickName = account.Nickname;
            _login = account.Login;
            _password = account.Password;

            DeleteAccoundCommand = new RelayCommand(o =>
            {
                database.Accounts.RemoveAt(id);
                database.SaveDatabase();
                AccountsViewModel.FillAccountTabViews();
            });

            EditOrViewAccountCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountDataViewCommand.Execute(Id);
            });

            ViewAccountNoteModeCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountDataViewCommand.Execute(Id*-1);
            });

            OpenUrlProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo("https://steamcommunity.com/profiles/" + SteamId.ToString()) { UseShellExecute = true }))
                {
                    ;
                }
            });

            DeleteAccoundCommand = new RelayCommand(o =>
            {
                if (!Config._config.NoConfirmMode)
                    AccountsViewModel.RemoveAccount(ref id);
                else
                {
                    database.Accounts.RemoveAt(id);
                    AccountsViewModel.AccountTabViews.RemoveAt(id);
                    MainWindowViewModel.TotalAccounts = database.Accounts.Count;
                    database.SaveDatabase();
                }
            });

            ConnectToSteamCommand = new AsyncRelayCommand(async (o) => await ConnectToSteam());
        }
    }
}
