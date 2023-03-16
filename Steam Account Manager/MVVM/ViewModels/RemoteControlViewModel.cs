using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using SteamKit2;
using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using static SteamKit2.GC.Dota.Internal.CMsgDOTADPCFeed;

namespace Steam_Account_Manager.MVVM.ViewModels
{
    internal class RemoteControlViewModel : ObservableObject
    {

        #region Commands
        public AsyncRelayCommand LogOnCommand { get; set; }
        public AsyncRelayCommand LogOutCommand { get; set; }
        public RelayCommand ChangeNicknameCommand { get; set; }
        public AsyncRelayCommand RecentlyLogOnCommand { get; set; } 
        #endregion


        private string _username, _password, _authCode, _errorMsg;
        private bool _needAuthCode;
        public User CurrentUser => SteamRemoteClient.CurrentUser;

        private static bool _isLoggedOn;
        public static event EventHandler IsLoggedOnChanged;
        public static bool IsLoggedOn
        {
            get => _isLoggedOn;
            set
            {
                _isLoggedOn = value;
                IsLoggedOnChanged?.Invoke(null, EventArgs.Empty);
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

        public RemoteControlViewModel()
        {
            RecentlyLoggedIn = Config.Deserialize(App.WorkingDirectory + "\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey)
                as ObservableCollection<RecentlyLoggedAccount> ?? new ObservableCollection<RecentlyLoggedAccount>();
            SteamRemoteClient.UserStatusChanged += () => OnPropertyChanged(nameof(CurrentUser));

            IsLoggedOn = false;

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

                if (String.IsNullOrWhiteSpace(Username) || (String.IsNullOrEmpty(Password) && LoginKey == null))
                    return;

                EResult result = await Task<EResult>.Factory.StartNew(() =>
                {
                    return SteamRemoteClient.Login(Username, Password, AuthCode, LoginKey);
                }, TaskCreationOptions.LongRunning);

                if(result == EResult.Cancelled && o is RecentlyLoggedAccount acc && LoginKey != null)
                {
                    RecentlyLoggedIn.Remove(acc);
                    Config.Serialize(RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
                }

                CheckLoginResult(result);

            });
        }
    }
}
