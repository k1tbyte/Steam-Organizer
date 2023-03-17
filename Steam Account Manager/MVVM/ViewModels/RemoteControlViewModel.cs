﻿using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.Core;
using SteamKit2;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace Steam_Account_Manager.MVVM.ViewModels
{
    internal class RemoteControlViewModel : ObservableObject
    {

        #region Commands
        public AsyncRelayCommand LogOnCommand { get; set; }
        public RelayCommand LogOutCommand { get; set; }
        public RelayCommand ChangeNicknameCommand { get; set; }
        public RelayCommand RemoveRecentUserCommand { get; set; }
        public RelayCommand OpenStoreAppLinkCommand { get; set; }
        public RelayCommand UpdateGamesListCommand { get; set; }
        #endregion


        private string _username, _password, _authCode, _errorMsg,_steamId;
        private bool _needAuthCode;
        public User CurrentUser => SteamRemoteClient.CurrentUser;

        private bool _isLoggedOn;
        public bool IsLoggedOn
        {
            get => _isLoggedOn;
            set => SetProperty(ref _isLoggedOn, value);
        }

        private bool _isGamesIdling;
        public bool IsGamesIdling
        {
            get => _isGamesIdling;
            set
            {
                if(value)
                {
                    if (SelectedGamesCount <= 0 && String.IsNullOrWhiteSpace(CurrentUser.CustomGameTitle)) return;

                    var selected = Games?.Where(game => game.IsSelected);
                    _ = SteamRemoteClient.IdleGames(selected?.Select(game => game.AppID).ToHashSet(), CurrentUser.CustomGameTitle);
                }
                else
                {
                    _ = SteamRemoteClient.StopIdle();
                }

                SetProperty(ref _isGamesIdling, value);
            }
        }

        private static ObservableCollection<RecentlyLoggedAccount> _recentlyLoggedIn;
        public static event EventHandler RecentlyLoggedOnChanged;
        public static ObservableCollection<RecentlyLoggedAccount> RecentlyLoggedIn
        {
            get => _recentlyLoggedIn;
            set
            {
                _recentlyLoggedIn = value;
                RecentlyLoggedOnChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private ObservableCollection<PlayerGame> _games;
        public ObservableCollection<PlayerGame> Games
        {
            get => _games;
            set => SetProperty(ref _games, value);
        }
        private int _selectedGamesCount;
        public int SelectedGamesCount 
        { 
            get => _selectedGamesCount;
            set => SetProperty(ref _selectedGamesCount, value);
        }

        private int _selectedTabIndex;
        public int SelectedTabIndex
        {
            get => _selectedTabIndex;
            set
            {
                if(value == 1 && Games == null)
                {
                   Games = SteamRemoteClient.GetOwnedGames().Result;
                }

                SetProperty(ref _selectedTabIndex, value);
            }
        }

        #region Properties
        public string AuthCode
        {
            get => _authCode;
            set => SetProperty(ref _authCode, value);
        }
        public string Password
        {
            get => _password;
            set => SetProperty(ref _password, value);
        }
        public string Username
        {
            get => _username;
            set => SetProperty(ref _username, value);
        }

        public string ErrorMsg
        {
            get => _errorMsg;
            set => SetProperty(ref _errorMsg, value);
        }
        public bool NeedAuthCode
        {
            get => _needAuthCode;
            set => SetProperty(ref _needAuthCode, value);
        }
        #endregion

        #region Helpers
        private void CheckLoginResult(EResult result)
        {
            ErrorMsg = "";
            switch (result)
            {
                case EResult.InvalidPassword:
                    ErrorMsg = App.FindString("rc_lv_invalidPass");
                    Password = "";
                    break;
                case EResult.NoConnection:
                    ErrorMsg = App.FindString("rc_lv_noInternet");
                    break;
                case EResult.ServiceUnavailable:
                    ErrorMsg = App.FindString("rc_lv_servUnavailable");
                    break;
                case EResult.Timeout:
                    ErrorMsg = App.FindString("rc_lv_workTimeout");
                    break;
                case EResult.RateLimitExceeded:
                    ErrorMsg = App.FindString("rc_lv_retriesExceeded");
                    break;
                case EResult.TryAnotherCM:
                    ErrorMsg = App.FindString("rc_lv_tryLater");
                    break;
                case EResult.Cancelled:
                    ErrorMsg = App.FindString("rc_lv_keyExpired");
                    break;
                case EResult.AccountLogonDenied:
                case EResult.AccountLoginDeniedNeedTwoFactor:
                    NeedAuthCode = true;
                    break;
            }
        }
        private void HandleDisconnection()
        {
            if (Games != null && Games.Count > 0)
            {
                Utils.Common.BinarySerialize(Games.ToArray(), $"{App.WorkingDirectory}\\Cache\\Games\\{_steamId}.dat");
            }
            Games = null;
            _steamId = null;
            _isGamesIdling = IsLoggedOn = false;
            SelectedGamesCount = 0;
        }
        private void HandleConnection()
        {
            _steamId = SteamRemoteClient.CurrentUser.SteamID64.ToString();
            string gamesCache = $"{App.WorkingDirectory}\\Cache\\Games\\{_steamId}.dat";

            if (System.IO.File.Exists(gamesCache))
            {
                Games = new ObservableCollection<PlayerGame>(Utils.Common.BinaryDeserialize<PlayerGame[]>(gamesCache));
                SelectedGamesCount = Games.Where(o => o.IsSelected).Count();

                if(SelectedGamesCount > 0 && CurrentUser.AutoIdlingGames)
                    IsGamesIdling = true;
            }

            IsLoggedOn = true;
        } 
        #endregion

        public RemoteControlViewModel()
        {
            RecentlyLoggedIn = Config.Deserialize(App.WorkingDirectory + "\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey)
                as ObservableCollection<RecentlyLoggedAccount> ?? new ObservableCollection<RecentlyLoggedAccount>();

            SteamRemoteClient.UserStatusChanged += () => OnPropertyChanged(nameof(CurrentUser));
            SteamRemoteClient.Connected += HandleConnection;
            SteamRemoteClient.Disconnected += HandleDisconnection;

            LogOnCommand = new AsyncRelayCommand(async (o) =>
            {
                string LoginKey = null;
                if (o is string key && !String.IsNullOrWhiteSpace(key))
                {
                    LoginKey = key;
                }
                else if(o is RecentlyLoggedAccount recentAcc && !String.IsNullOrWhiteSpace(recentAcc.Loginkey) && !String.IsNullOrWhiteSpace(recentAcc.Username))
                {
                    LoginKey = recentAcc.Loginkey;
                    Username = recentAcc.Username;
                }
                else if(o is Account acc)
                {
                    Username = acc.Login;
                    Password = acc.Password;
                    if(System.IO.File.Exists(acc.AuthenticatorPath))
                        AuthCode = JsonConvert.DeserializeObject<SteamGuardAccount>(System.IO.File.ReadAllText(acc.AuthenticatorPath)).GenerateSteamGuardCode();
                }

                if (String.IsNullOrWhiteSpace(Username) || (String.IsNullOrEmpty(Password) && LoginKey == null))
                    return;

                EResult result = await Task<EResult>.Factory.StartNew(() =>
                {
                    return SteamRemoteClient.Login(Username, Password, AuthCode, LoginKey);
                }, TaskCreationOptions.LongRunning);

                if(result == EResult.Cancelled && o is RecentlyLoggedAccount tmp && LoginKey != null)
                {
                    RecentlyLoggedIn.Remove(tmp);
                    Config.Serialize(RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
                }

                CheckLoginResult(result);
            });

            #region Common account command
            RemoveRecentUserCommand = new RelayCommand(o =>
    {
        RecentlyLoggedIn.Remove(o as RecentlyLoggedAccount);
        Config.Serialize(RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
    });
            LogOutCommand = new RelayCommand(o =>
            {
                SteamRemoteClient.Logout();
                Username = Password = AuthCode = "";
                NeedAuthCode = false;
            });
            ChangeNicknameCommand = new RelayCommand(o =>
            {
                if (o is System.Windows.Controls.TextBox txtBox && !String.IsNullOrEmpty(txtBox.Text) && txtBox.Text != CurrentUser.Nickname)
                {
                    SteamRemoteClient.ChangeCurrentName(txtBox.Text);
                }
            });
            #endregion

            OpenStoreAppLinkCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo($"https://store.steampowered.com/app/{o}")).Dispose());
            UpdateGamesListCommand = new RelayCommand(o => Games = SteamRemoteClient.GetOwnedGames().Result);
        }

    }
}
