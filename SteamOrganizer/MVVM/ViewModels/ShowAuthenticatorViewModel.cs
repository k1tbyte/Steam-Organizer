using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.Infrastructure.SteamRemoteClient.Authenticator;
using SteamOrganizer.MVVM.Core;
using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class ShowAuthenticatorViewModel : ObservableObject
    {
        public RelayCommand CloseWindowCommand { get; set; }


        private readonly Account currentAccount;
        private string _accountName = ". . .", _steamGuardCode = (string)App.Current.FindResource("saw_loading");
        private SteamGuardAccount guard;
        private bool _remove;

        private int _timerValue = 30;

        #region Properties
        public string AccountName
        {
            get => _accountName;
            set => SetProperty(ref _accountName, value);
        }
        public int TimerValue
        {
            get => _timerValue;
            set => SetProperty(ref _timerValue, value);
        }
        public string SteamGuardCode
        {
            get => _steamGuardCode;
            set => SetProperty(ref _steamGuardCode, value);
        }
        #endregion

        private void LoadSteamGuardAccountFromFilePath()
        {
            guard = null;
            if (!String.IsNullOrEmpty(currentAccount.AuthenticatorPath) && File.Exists(currentAccount.AuthenticatorPath))
            {
                guard = JsonConvert.DeserializeObject<SteamGuardAccount>(File.ReadAllText(currentAccount.AuthenticatorPath));
                SteamGuardCode = guard.GenerateSteamGuardCode();
                AccountName = guard.AccountName;
            }
        }

        private async void GenerateSteamGuard()
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

        public ShowAuthenticatorViewModel(Account acc)
        {
            currentAccount = acc;

            CloseWindowCommand = new RelayCommand(o =>
            {
                _remove = true;
                (o as System.Windows.Window).Close();
            });

            GenerateSteamGuard();
        }
    }
}
