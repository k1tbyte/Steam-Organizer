using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using SteamAuth;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Steam_Account_Manager.ViewModels
{
    internal class ShowAuthenticatorViewModel : ObservableObject
    {
        public AsyncRelayCommand RemoveAuthenticatorCommand { get; set; }
        public RelayCommand CloseWindowCommand { get; set; }


        private int _id;
        private string _authPath,_accountName = "Login", _steamGuardCode = (string)App.Current.FindResource("saw_loading"), _errorMessage;
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
                    ErrorMessage = (string)App.Current.FindResource("saw_authRemove");
                    bool success = guard.DeactivateAuthenticator();
                    ErrorMessage = success == true ? (string)App.Current.FindResource("saw_authRemoveSuccess") :
                    (string)App.Current.FindResource("saw_authRemoveError");
                    _remove = true;
                    File.Delete(Config.Accounts[_id].AuthenticatorPath);
                    Config.Accounts[_id].AuthenticatorPath = null;
                    Config.SaveAccounts();
                    Thread.Sleep(2500);
                }
                catch
                {
                    ErrorMessage = (string)App.Current.FindResource("saw_unknownError");
                    Thread.Sleep(2000);
                }
            });
        }
            
        public ShowAuthenticatorViewModel(int accountId)
        {
            _id = accountId;
            _authPath = Config.Accounts[_id].AuthenticatorPath;
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
