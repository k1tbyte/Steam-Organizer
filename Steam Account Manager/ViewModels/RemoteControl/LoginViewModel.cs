using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using SteamKit2;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class LoginViewModel : ObservableObject
    {
        public AsyncRelayCommand LogOnCommand { get; set; }

        public static event EventHandler SuccessLogOnChanged;

        private bool _isAuthCode;
        private string _username, _password,_authCode, _errorMsg;
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

        public LoginViewModel()
        {
            LogOnCommand = new AsyncRelayCommand(async (o) =>
            {
                EResult result =  await Task<EResult>.Factory.StartNew(() =>
                {
                    return SteamRemoteClient.Login(Username, Password, AuthCode);
                }); 

                if (result == EResult.AccountLoginDeniedNeedTwoFactor || result == EResult.AccountLogonDenied)
                {
                    IsAuthCode = true;
                    ErrorMsg = "";
                }
                else
                {
                    switch (result)
                    {
                        case EResult.NoConnection:
                            ErrorMsg = "No internet connection...";
                            break;
                        case EResult.InvalidPassword:
                            ErrorMsg = "Invalid password!";
                            break;
                        case EResult.TwoFactorCodeMismatch:
                            ErrorMsg = "Invalid 2FA code!";
                            break;
                        case EResult.InvalidLoginAuthCode:
                            ErrorMsg = "Invalid auth code!";
                            break;
                        case EResult.ServiceUnavailable:
                            ErrorMsg = "Service unavailable";
                            break;
                        case EResult.Timeout:
                            ErrorMsg = "Timeout in work...";
                            break;
                        case EResult.RateLimitExceeded:
                            ErrorMsg = "Retries exceeded. Please try again in 35 minutes";
                            break;
                    }
                }
                
                
            });
        }
    }
}
