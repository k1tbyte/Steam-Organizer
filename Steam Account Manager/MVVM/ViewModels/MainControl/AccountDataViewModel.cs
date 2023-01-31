using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Parsers;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal sealed class AccountDataViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand CancelCommand { get; set; }
        public RelayCommand CopyCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }
        public RelayCommand OpenFromIdLinkCommand { get; set; }
        public AsyncRelayCommand ParseCsgoStatsInfo { get; set; }
        public RelayCommand SaveChangesComamnd { get; set; }
        public RelayCommand OpenOtherLinksCommand { get; set; }
        public RelayCommand ExportAccountCommand { get; set; }
        public RelayCommand AddAuthenticatorCommand { get; set; }
        public AsyncRelayCommand RefreshCommand { get; set; } 
        #endregion

        private readonly Account currentAccount;
        public Account CurrentAccount => currentAccount;

        private bool _noticeView = false;
        private string _csgoParseError, _steamDataValidateError, _notifyMsg;

        #region Properties
        public string NotifyMsg
        {
            get => _notifyMsg;
            set => SetProperty(ref _notifyMsg, value);
        }
        public string SteamDataValidateError
        {
            get => _steamDataValidateError;
            set => SetProperty(ref _steamDataValidateError, value);
        }
        public string CsgoParseError
        {
            get => _csgoParseError;
            set => SetProperty(ref _csgoParseError, value);
        }

        public bool NoticeView
        {
            get => _noticeView;
            set => SetProperty(ref _noticeView, value);
        }

        private string _passwordTemp;
        public string Password
        {
            get => _passwordTemp;
            set
            {
                _passwordTemp = value;
                ValidateData();
            }
        }

        private string _loginTemp;
        public string Login
        {
            get => _loginTemp;
            set
            {
                _loginTemp = value;
                ValidateData();
            }
        }

        public Visibility OnlyPreview { get; private set; } = Visibility.Visible;
        #endregion

        #region Helpers
        private async void ShowNotificationAsync(string message)
        {
            NotifyMsg = message;
            NoticeView = true;
            await Task.Delay(2000).ConfigureAwait(false);
            NoticeView = false;
        }
        private async Task ShowCsgoErrorAsync(string msg)
        {
            CsgoParseError = msg;
            await Task.Delay(2000);
            CsgoParseError = "";
        }
        private void ValidateData()
        {
            if (_loginTemp == "")
                SteamDataValidateError = App.FindString("adv_error_login_empty");
            else if (_loginTemp.Contains(" "))
                SteamDataValidateError = App.FindString("adv_error_login_contain_spaces");
            else if (_loginTemp.Length < 3)
                SteamDataValidateError = App.FindString("adv_error_login_shortage");
            else if (_loginTemp.Length > 32)
                SteamDataValidateError = App.FindString("adv_error_login_overflow");
            else if (_passwordTemp == "")
                SteamDataValidateError = App.FindString("adv_error_pass_empty");
            else if (_passwordTemp.Length < 6)
                SteamDataValidateError = App.FindString("adv_error_pass_shortage");
            else if (_passwordTemp.Length > 50)
                SteamDataValidateError = App.FindString("adv_error_pass_overflow");
            else
            {
                if (!String.IsNullOrEmpty(_steamDataValidateError))
                    SteamDataValidateError = "";
                CurrentAccount.Password = _passwordTemp;
                CurrentAccount.Login = _loginTemp;
            }
        }
        #endregion

        #region Parsers
        private async Task CsgoStatsParse()
        {
            try
            {
                var csgo_parser = new CsgoParser(currentAccount.SteamId64.Value);
                CsgoParseError = App.FindString("adat_cs_inf_takeStats");
                if (!await csgo_parser.GlobalStatsParse())
                {
                    await ShowCsgoErrorAsync(App.FindString("adat_cs_inf_errortakeStats")).ConfigureAwait(false);
                    return;
                }
                CsgoParseError = App.FindString("adat_cs_inf_takeRank");
                await csgo_parser.RankParse();

                currentAccount.CSGOStats = csgo_parser.CSGOStats;
                OnPropertyChanged(nameof(CurrentAccount));

                await ShowCsgoErrorAsync(App.FindString("adat_cs_inf_updSucces")).ConfigureAwait(false);
            }
            catch
            {
                await ShowCsgoErrorAsync(App.FindString("adat_cs_inf_serverError")).ConfigureAwait(false);
            }
        }
        private async Task RefreshAccount()
        {
            try
            {
                await currentAccount.ParseInfo();
                OnPropertyChanged(nameof(CurrentAccount));
                Config.SaveAccounts();
                ShowNotificationAsync(App.FindString("adat_cs_inf_updated"));
            }
            catch
            {
                ShowNotificationAsync(App.FindString("adat_cs_inf_noInternet"));
            }
        } 
        #endregion

        public AccountDataViewModel(Account account,bool preview = false)
        {
            if (preview)
                OnlyPreview = Visibility.Collapsed;

            currentAccount = account;
            _passwordTemp  = currentAccount.Password;
            _loginTemp     = currentAccount.Login;

            CancelCommand         = new RelayCommand(o => MainWindowViewModel.AccountsViewCommand.Execute(true));

            OpenUrlProfileCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo(currentAccount.ProfileURL)).Dispose());

            RefreshCommand        = new AsyncRelayCommand(async (o) => await RefreshAccount());

            OpenOtherLinksCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo(currentAccount.ProfileURL + (string)o)).Dispose());

            OpenFromIdLinkCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo((string)o + currentAccount.SteamId64)).Dispose());

            CopyCommand = new RelayCommand(o =>
            {
                var box = o as TextBox;
                box.SelectAll();
                box.Copy();
                ShowNotificationAsync(App.FindString("adat_notif_copiedClipoard"));
            });

            ParseCsgoStatsInfo = new AsyncRelayCommand(async (o) =>
            {
                if(!Utils.Common.CheckInternetConnection())
                {
                    await ShowCsgoErrorAsync(App.FindString("adat_cs_inf_noInternet")).ConfigureAwait(false);
                    return;
                }
                else if (currentAccount.IsProfilePublic && currentAccount.GamesPlayedCount.HasValue && currentAccount.GamesPlayedCount.Value > 0)
                {
                    await CsgoStatsParse().ConfigureAwait(false);
                } 
                else
                {
                    await ShowCsgoErrorAsync(App.FindString("adat_cs_inf_profilePrivateOrNullGames")).ConfigureAwait(false);
                    return;
                }
            });

            SaveChangesComamnd = new RelayCommand(o =>
            {
                currentAccount.LastUpdateTime = DateTime.Now;
                Config.SaveAccounts();
                ShowNotificationAsync(App.FindString("adat_notif_changesSaved"));
            });

            ExportAccountCommand = new RelayCommand(o =>
            {
                var fileDialog = new Microsoft.Win32.SaveFileDialog
                {
                    Filter = "Steam Account (.sa)|*.sa"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    Config.Serialize(currentAccount, fileDialog.FileName, Config.Properties.UserCryptoKey);
                    ShowNotificationAsync(App.FindString("adat_notif_accountExported"));
                }
            });

            AddAuthenticatorCommand = new RelayCommand(o =>
            {
                if (currentAccount.AuthenticatorPath == null || !System.IO.File.Exists(currentAccount.AuthenticatorPath))
                    Utils.Presentation.OpenDialogWindow(new AddAuthenticatorWindow(currentAccount));
                else
                    Utils.Presentation.OpenDialogWindow(new ShowAuthenticatorWindow(currentAccount));
            });


        }
    }
}
