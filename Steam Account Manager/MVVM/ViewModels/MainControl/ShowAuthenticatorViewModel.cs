using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.Core;
using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal class ShowAuthenticatorViewModel : ObservableObject
    {
        public AsyncRelayCommand RemoveAuthenticatorCommand { get; set; }
        public AsyncRelayCommand AcceptConfirmationCommand { get; set; }
        public AsyncRelayCommand DenyConfirmationCommand { get; set; }
        public AsyncRelayCommand RefreshConfirmationsCommand { get; set; }
        public RelayCommand CloseWindowCommand { get; set; }


        private int _id;
        private string _authPath, _accountName = "Login", _steamGuardCode = (string)App.Current.FindResource("saw_loading"), _errorMessage;
        private SteamGuardAccount guard;
        private bool _remove;
        private ObservableCollection<Confirmation> _confirmations;

        private int _timerValue = 30;

        #region Properties
        public ObservableCollection<Confirmation> Confirmations
        {
            get => _confirmations;
            set
            {
                _confirmations = value;
                OnPropertyChanged(nameof(Confirmations));
            }
        }
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
        #endregion

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
            await Task.Factory.StartNew(async () =>
            {
                LoadSteamGuardAccountFromFilePath();
                await guard.RefreshSessionAsync().ConfigureAwait(false);
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
                (o as System.Windows.Window).Close();
            });

            RemoveAuthenticatorCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!String.IsNullOrEmpty(ErrorMessage))
                    ErrorMessage = "";
                await RemoveAuthenticator().ConfigureAwait(false);
                (o as System.Windows.Window).Close();
            });

            AcceptConfirmationCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!String.IsNullOrEmpty(ErrorMessage))
                    ErrorMessage = "";
                foreach (var item in Confirmations)
                {
                    if (item.ID == (ulong)o)
                    {
                        if (await guard.AcceptConfirmation(item).ConfigureAwait(false))
                        {
                            Confirmations.Remove(item);
                        }
                        else
                        {
                            ErrorMessage = "An error occurred while confirmation...";
                        }
                        break;
                    }
                }
            });

            DenyConfirmationCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!String.IsNullOrEmpty(ErrorMessage))
                    ErrorMessage = "";
                foreach (var item in Confirmations)
                {
                    if (item.ID == (ulong)o)
                    {
                        if (await guard.DenyConfirmation(item).ConfigureAwait(false))
                        {
                            Confirmations.Remove(item);
                        }
                        else
                        {
                            ErrorMessage = "An error occurred while denying...";
                        }
                        break;
                    }
                }
            });

            RefreshConfirmationsCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!String.IsNullOrEmpty(ErrorMessage))
                    ErrorMessage = "";
                try
                {
                    Confirmations = await guard.FetchConfirmationsAsync().ConfigureAwait(false);
                    App.Current.Dispatcher.Invoke(() =>
                    {
                        Themes.Animations.ShakingAnimation(o as System.Windows.FrameworkElement, true);
                    });
                }
                catch
                {
                    ErrorMessage = "An error occurred while updating...";
                }

            });

            _ = GenerateSteamGuard();
        }
    }
}
