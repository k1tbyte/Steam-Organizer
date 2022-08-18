using Steam_Account_Manager.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SteamAuth;
using System.IO;
using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure.Base;
using System.Threading;

namespace Steam_Account_Manager.ViewModels
{
    internal class ShowAuthenticatorViewModel : ObservableObject
    {
        public AsyncRelayCommand RemoveAuthenticatorCommand { get; set; }
        public RelayCommand CloseWindowCommand { get; set; }


        private int _id;
        private Config config;
        private string _authPath,_accountName = "Login", _steamGuardCode = "Loading...",_errorMessage;
        private SteamGuardAccount guard;
        private bool _remove;

        private int _timerValue=30;

        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                _errorMessage = value;
                OnPropertyChanged(nameof(ErrorMessage));
            }
        }
        public string AccountName
        {
            get => _accountName;
            set
            {
                _accountName = value;
                OnPropertyChanged(nameof(AccountName));
            }
        }
        public int TimerValue
        {
            get => _timerValue;
            set
            {
                _timerValue = value;
                OnPropertyChanged(nameof(TimerValue));
            }
        }
        public string SteamGuardCode
        {
            get => _steamGuardCode;
            set
            {
                _steamGuardCode = value;
                OnPropertyChanged(nameof(SteamGuardCode));
            }
        }

        private void LoadSteamGuardAccountFromFilePath()
        {
            guard = null;
            if (!String.IsNullOrEmpty(_authPath) && File.Exists(_authPath))
            {
                guard = JsonConvert.DeserializeObject<SteamGuardAccount>(File.ReadAllText(_authPath));
                SteamGuardCode = guard.GenerateSteamGuardCode();
                AccountName = guard.AccountName;
            }
            
        }

        private async Task GenerateSteamGuard()
        {
            await Task.Factory.StartNew(() =>
            {
                LoadSteamGuardAccountFromFilePath();
                while (!_remove)
                {
                    Thread.Sleep(1000);
                    TimerValue--;
                    if (TimerValue == -1)
                    {
                        TimerValue = 30;
                        SteamGuardCode = guard.GenerateSteamGuardCode();
                    }
                }
            });
        }

        private async Task RemoveAuthenticator()
        {
            await Task.Factory.StartNew(() =>
            {
                try
                {
                    ErrorMessage = "Authenticator being removed...";
                    bool success = guard.DeactivateAuthenticator();
                    ErrorMessage = success == true ? "Authenticator disabled, use your username and password to log in" :
                    "An error occurred while trying to deactivate the authenticator, please try again later";
                    _remove = true;
                    File.Delete(config.AccountsDb[_id].AuthenticatorPath);
                    config.AccountsDb[_id].AuthenticatorPath = null;
                    config.SaveChanges();
                    Thread.Sleep(2500);
                }
                catch
                {
                    ErrorMessage = "An unknown error occurred during deactivation, the authenticator was not removed.";
                    Thread.Sleep(2000);
                }
            });
        }
            
        public ShowAuthenticatorViewModel(int accountId)
        {
            _id = accountId;
            config = Config.GetInstance();
            _authPath = config.AccountsDb[_id].AuthenticatorPath;
            CloseWindowCommand = new RelayCommand(o =>
            {
                ExecuteWindow(o);
            });

            RemoveAuthenticatorCommand = new AsyncRelayCommand(async (o) =>
            {
                await RemoveAuthenticator();
                ExecuteWindow(o);
            });

            _ = GenerateSteamGuard();
        }
    }
}
