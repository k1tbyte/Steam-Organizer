using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using SteamKit2;
using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class LoginViewModel : ObservableObject
    {
        public AsyncRelayCommand LogOnCommand { get; set; }
        public AsyncRelayCommand RecentlyLogOnCommand { get; set; }
        public RelayCommand ChangeNicknameCommand { get; set; }
        public RelayCommand LogOutCommand { get; set; }


        private bool _isAuthCode;
        private string _username, _password, _authCode, _errorMsg;

        #region Callbacks receiver handlers

        public User CurrentUser => SteamRemoteClient.CurrentUser;

        public static event EventHandler SuccessLogOnChanged;
        private static bool _successLogOn;
        public static bool SuccessLogOn
        {
            get => _successLogOn;
            set
            {
                _successLogOn = value;
                SuccessLogOnChanged?.Invoke(null, EventArgs.Empty);
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
        #endregion

        #region Properties
        public string ErrorMsg
        {
            get => _errorMsg;
            set => SetProperty(ref _errorMsg, value);
        }
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
        public bool IsAuthCode
        {
            get => _isAuthCode;
            set => SetProperty(ref _isAuthCode, value);
        }
        #endregion

        private void CheckLoginResult(EResult result)
        {
            if (!App.MainWindow.IsVisible && result != EResult.OK && result != EResult.NotLoggedOn)
            {
                Utils.Presentation.OpenPopupMessageBox($"{CurrentUser.Nickname} {App.FindString("rc_lv_accAlreadyUse")}", true);
                LogOutCommand.Execute(null);
            }
            else if(result == EResult.LoggedInElsewhere)
            {
                var nickname = CurrentUser.Nickname;
                LogOutCommand.Execute(null);
                Utils.Presentation.OpenMessageBox($"{nickname} {App.FindString("rc_lv_accAlreadyUse")}","some title later");
            }
            else
            {
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
                }
            }
        }


        public LoginViewModel()
        {
            RecentlyLoggedIn = Config.Deserialize(App.WorkingDirectory + "\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey) 
                as ObservableCollection<RecentlyLoggedAccount> ?? new ObservableCollection<RecentlyLoggedAccount>();

            SteamRemoteClient.UserStatusChanged += () => OnPropertyChanged(nameof(CurrentUser));


            LogOnCommand = new AsyncRelayCommand(async (o) =>
            {
                if (String.IsNullOrEmpty(Username) || String.IsNullOrEmpty(Password))
                    return;

                EResult result = await Task<EResult>.Factory.StartNew(() =>
                {
                    return SteamRemoteClient.Login(Username, Password, AuthCode);
                }, TaskCreationOptions.LongRunning);


                if (result == EResult.AccountLoginDeniedNeedTwoFactor || result == EResult.AccountLogonDenied || result == EResult.Cancelled)
                {
                    IsAuthCode = true;
                    ErrorMsg = "";
                }
                else
                {
                    CheckLoginResult(result);
                }

            });

            ChangeNicknameCommand = new RelayCommand(o =>
            {
                if (o is TextBox txtBox && !String.IsNullOrEmpty(txtBox.Text) && txtBox.Text != CurrentUser.Nickname)
                {
                    SteamRemoteClient.ChangeCurrentName(txtBox.Text);
                }
            });

            RecentlyLogOnCommand = new AsyncRelayCommand(async (o) =>
            {
                var element = (o as ListBox).SelectedItem as RecentlyLoggedAccount;
                Username = element.Username;
                EResult result = await Task<EResult>.Factory.StartNew(() =>
                {
                    return SteamRemoteClient.Login(Username, "using", null, element.Loginkey);
                },TaskCreationOptions.LongRunning);

                if (result == EResult.Cancelled || result == EResult.Invalid)
                {
                    ErrorMsg = App.FindString("rc_lv_keyExpired");
                    RecentlyLoggedIn.Remove(element);
                    Config.Serialize(RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
                }
                else
                {
                    CheckLoginResult(result);
                }
                 
            });

            LogOutCommand = new RelayCommand(o =>
            {
                SteamRemoteClient.Logout();
                Username = Password = AuthCode = "";
                IsAuthCode = false;
            });
        }


    }
}
