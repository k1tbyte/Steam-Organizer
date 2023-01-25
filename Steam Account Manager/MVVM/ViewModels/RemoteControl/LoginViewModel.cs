using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using SteamKit2;
using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Media;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class LoginViewModel : ObservableObject
    {
        public AsyncRelayCommand LogOnCommand { get; set; }
        public AsyncRelayCommand RecentlyLogOnCommand { get; set; }
        public RelayCommand ChangeNicknameCommand { get; set; }
        public RelayCommand LogOutCommand { get; set; }
        public RelayCommand PrivacySettingsCommand { get; set; }


        private bool _isAuthCode;
        private string _username, _password, _authCode, _errorMsg;

        #region Callbacks receiver handlers

        private static string _steamId64;
        public static event EventHandler SteamId64Changed;
        public static string SteamId64
        {
            get => _steamId64;
            set
            {
                _steamId64 = value;
                SteamId64Changed?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _wallet;
        public static event EventHandler WalletChanged;
        public static string Wallet
        {
            get => _wallet;
            set
            {
                _wallet = value;
                WalletChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _ipCountryCode;
        public static event EventHandler IPCountryCodeChanged;
        public static string IPCountryCode
        {
            get => _ipCountryCode;
            set
            {
                _ipCountryCode = value;
                IPCountryCodeChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _countryImage;
        public static event EventHandler CountryImageChanged;
        public static string CountryImage
        {
            get => _countryImage;
            set
            {
                _countryImage = value;
                CountryImageChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _nickname;
        public static event EventHandler NicknameChanged;
        public static string Nickname
        {
            get => _nickname;
            set
            {
                _nickname = value;
                NicknameChanged?.Invoke(null, EventArgs.Empty);
            }
        }
        private static int _authedComputers;
        public static event EventHandler AuthedComputersChanged;
        public static int AuthedComputers
        {
            get => _authedComputers;
            set
            {
                _authedComputers = value;
                AuthedComputersChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _emailAddress;
        public static event EventHandler EmailAddressChanged;
        public static string EmailAddress
        {
            get => _emailAddress;
            set
            {
                _emailAddress = value;
                EmailAddressChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static bool _emailVerification;
        public static event EventHandler EmailVerificationChanged;
        public static bool EmailVerification
        {
            get => _emailVerification;
            set
            {
                _emailVerification = value;
                EmailVerificationChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static string _imageUrl;
        public static event EventHandler ImageUrlChanged;
        public static string ImageUrl
        {
            get => _imageUrl;
            set
            {
                _imageUrl = value;
                ImageUrlChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static Brush _avatarStateOutline;
        public static event EventHandler AvatarStateOutlineChanged;
        public static Brush AvatarStateOutline
        {
            get => _avatarStateOutline;
            set
            {
                _avatarStateOutline = value;
                AvatarStateOutlineChanged?.Invoke(null, EventArgs.Empty);
            }
        }

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
            set
            {
                _errorMsg = value;
                OnPropertyChanged(nameof(ErrorMsg));
            }
        }
        public string AuthCode
        {
            get => _authCode;
            set
            {
                _authCode = value;
                OnPropertyChanged(nameof(AuthCode));
            }
        }
        public string Password
        {
            get => _password;
            set
            {
                _password = value;
                OnPropertyChanged(nameof(Password));
            }
        }
        public string Username
        {
            get => _username;
            set
            {
                _username = value;
                OnPropertyChanged(nameof(Username));
            }
        }
        public bool IsAuthCode
        {
            get => _isAuthCode;
            set
            {
                _isAuthCode = value;
                OnPropertyChanged(nameof(IsAuthCode));
            }
        }
        #endregion

        private void CheckLoginResult(EResult result)
        {
            if (!App.MainWindow.IsVisible && result != EResult.OK && result != EResult.NotLoggedOn)
            {
                Utils.Presentation.OpenPopupMessageBox($"{SteamRemoteClient.UserPersonaName} {(string)App.Current.FindResource("rc_lv_accAlreadyUse")}", true);
                LogOutCommand.Execute(null);
            }
            else if(result == EResult.LoggedInElsewhere)
            {
                var nickname = SteamRemoteClient.UserPersonaName;
                LogOutCommand.Execute(null);
                Utils.Presentation.OpenMessageBox($"{nickname} {(string)App.Current.FindResource("rc_lv_accAlreadyUse")}","some title later");
            }
            else
            {
                switch (result)
                {
                    case EResult.InvalidPassword:
                        ErrorMsg = (string)App.Current.FindResource("rc_lv_invalidPass");
                        Password = "";
                        break;
                    case EResult.NoConnection:
                        ErrorMsg = (string)App.Current.FindResource("rc_lv_noInternet");
                        break;
                    case EResult.ServiceUnavailable:
                        ErrorMsg = (string)App.Current.FindResource("rc_lv_servUnavailable");
                        break;
                    case EResult.Timeout:
                        ErrorMsg = (string)App.Current.FindResource("rc_lv_workTimeout");
                        break;
                    case EResult.RateLimitExceeded:
                        ErrorMsg = (string)App.Current.FindResource("rc_lv_retriesExceeded");
                        break;
                    case EResult.TryAnotherCM:
                        ErrorMsg = (string)App.Current.FindResource("rc_lv_tryLater");
                        break;
                }
            }
        }

        public LoginViewModel()
        {
            RecentlyLoggedIn = Config.Deserialize(App.WorkingDirectory + "\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey) 
                as ObservableCollection<RecentlyLoggedAccount> ?? new ObservableCollection<RecentlyLoggedAccount>();


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
                if (Nickname != SteamRemoteClient.UserPersonaName)
                {
                    SteamRemoteClient.ChangeCurrentName(Nickname);
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
                    ErrorMsg = (string)App.Current.FindResource("rc_lv_keyExpired");
                    RecentlyLoggedIn.Remove(element);
                    Config.Serialize(RecentlyLoggedIn, App.WorkingDirectory + "\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
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

            PrivacySettingsCommand = new RelayCommand(o =>
            {

            });
        }
    }
}
