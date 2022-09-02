﻿using System;
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
        public RelayCommand ChangeNicknameCommand { get; set; }
        public static event EventHandler SuccessLogOnChanged;

        private bool _isAuthCode;
        private string _username, _password,_authCode, _errorMsg;
        private static bool _successLogOn;

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

        #endregion

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

                if (result == EResult.AccountLoginDeniedNeedTwoFactor || result == EResult.AccountLogonDenied || result == EResult.Cancelled)
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

            ChangeNicknameCommand = new RelayCommand(o =>
            {
                if (Nickname != SteamRemoteClient.UserPersonaName)
                {
                    SteamRemoteClient.ChangeCurrentName(Nickname);
                }

            });
        }
    }
}
