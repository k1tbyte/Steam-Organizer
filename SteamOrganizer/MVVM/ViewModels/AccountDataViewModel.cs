using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.Infrastructure.Models.JsonModels;
using SteamOrganizer.Infrastructure.Parsers;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Windows;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountDataViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand CancelCommand { get; set; }
        public RelayCommand CopyCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }
        public RelayCommand OpenFromIdLinkCommand { get; set; }
        public RelayCommand OpenStoreAppLinkCommand { get; set; }
        public AsyncRelayCommand ParseCsgoStatsInfo { get; set; }
        public RelayCommand SaveChangesComamnd { get; set; }
        public RelayCommand OpenOtherLinksCommand { get; set; }
        public RelayCommand ExportAccountCommand { get; set; }
        public RelayCommand AddAuthenticatorCommand { get; set; }
        public RelayCommand CreateAccountShortcutCommand { get; set; }
        public AsyncRelayCommand OpenFriendPageCommand { get; set; }
        public AsyncRelayCommand RefreshCommand { get; set; } 
        #endregion

        private Account currentAccount;
        public Account CurrentAccount => currentAccount;

        private string _csgoParseError, _steamDataValidateError;
        private int _tabSelectedIndex = 0;

        #region Properties

        public int TabSelectedIndex
        {
            get => _tabSelectedIndex;
            set
            {
                if (value == 1 && GamesList == null)
                    LoadGameList();

                if (value == 2 && FriendList == null)
                    LoadFriendList();

                SetProperty(ref _tabSelectedIndex, value);
            }
        }
        public PlayerGame[] GamesList
        {
            get => _gamesList;
            set => SetProperty(ref _gamesList, value);
        }
        private PlayerGame[] _gamesList = null;

        private Friend[] _friendList = null;
        public Friend[] FriendList
        {
            get => _friendList;
            set => SetProperty(ref _friendList, value);
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
                ((App.MainWindow.DataContext as MainWindowViewModel).AccountsV.DataContext as AccountsViewModel).SearchFilter.Refresh();
                LoadGameList();
                Config.SaveAccounts();
                Utils.Presentation.OpenPopupMessageBox(App.FindString("adat_cs_inf_updated"));
            }
            catch
            {
                Utils.Presentation.OpenPopupMessageBox(App.FindString("adat_cs_inf_noInternet"),true);
            }
        } 

        public void LoadGameList()
        {
            var gameList = $"{App.WorkingDirectory}\\Cache\\Games\\{currentAccount.SteamId64}.dat";
            if (File.Exists(gameList))
            {
                GamesList = Utils.Common.BinaryDeserialize<PlayerGame[]>(gameList);
            }
        }

        public async void LoadFriendList()
        {
            var friendList = $"{App.WorkingDirectory}\\Cache\\Friends\\{currentAccount.SteamId64}.dat";
            if (File.Exists(friendList))
            {
                FriendList = Utils.Common.BinaryDeserialize<Friend[]>(friendList);
            }
            else if (currentAccount.IsProfilePublic)
                FriendList = await SteamParser.ParseFriendsInfo(currentAccount.SteamId64.Value);
        }
        #endregion

        public AccountDataViewModel(Account account,bool preview = false)
        {
            currentAccount = account;

            if (preview)
            {
                OnlyPreview = Visibility.Collapsed;
            }

            _passwordTemp  = currentAccount.Password;
            _loginTemp     = currentAccount.Login;

            CancelCommand         = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountsViewCommand.Execute(true);
                TabSelectedIndex = 0;
            });

            OpenUrlProfileCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo($"https://steamcommunity.com/profiles/{o}")).Dispose());

            RefreshCommand        = new AsyncRelayCommand(async (o) => await RefreshAccount());

            OpenOtherLinksCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo(currentAccount.ProfileURL + (string)o)).Dispose());

            OpenFromIdLinkCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo((string)o + currentAccount.SteamId64)).Dispose());

            OpenStoreAppLinkCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo($"https://store.steampowered.com/app/{o}")).Dispose());

            CopyCommand = new RelayCommand(o =>
            {
                var box = o as TextBox;
                box.SelectAll();
                box.Copy();
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

                Utils.Presentation.OpenPopupMessageBox(App.FindString("adat_notif_changesSaved"));
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
                    Utils.Presentation.OpenPopupMessageBox(App.FindString("adat_notif_accountExported"));
                }
            });

            AddAuthenticatorCommand = new RelayCommand(o =>
            {
                if (currentAccount.AuthenticatorPath == null || !System.IO.File.Exists(currentAccount.AuthenticatorPath))
                    Utils.Presentation.OpenDialogWindow(new AddAuthenticatorWindow(currentAccount));
                else
                    Utils.Presentation.OpenDialogWindow(new ShowAuthenticatorWindow(currentAccount));
            });

            CreateAccountShortcutCommand = new RelayCommand(o =>
            {
                var icoPath = App.WorkingDirectory + "\\Cache\\ico";

                if (!Directory.Exists(icoPath))
                    Directory.CreateDirectory(icoPath);

                Utils.Imaging.SaveIcon(o as System.Windows.Media.ImageSource, icoPath + $"\\{currentAccount.SteamId64}.ico", new System.Drawing.Size(64, 64));
                Utils.Win32.CreateShortcut(
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                    $"{Regex.Replace(currentAccount.Nickname, "[\\/:*?\"<>|]+", "")}.lnk"),
                    Assembly.GetExecutingAssembly().Location,
                    $"-login {currentAccount.SteamId64}",
                    App.WorkingDirectory, null, "", icoPath + $"\\{currentAccount.SteamId64}.ico"
                     );

                Utils.Presentation.OpenPopupMessageBox($"A shortcut has been created on the desktop for the account: {currentAccount.Nickname}");
            });

            OpenFriendPageCommand = new AsyncRelayCommand(async (o) =>
            {
                currentAccount   = new Account("", "", (ulong)o);
                await currentAccount.ParseInfo();
                TabSelectedIndex = 0;
                OnlyPreview      = Visibility.Collapsed;
                GamesList        = null;
                FriendList       = null;
                OnPropertyChanged(nameof(OnlyPreview));
                OnPropertyChanged(nameof(CurrentAccount));
            });

        }
    }
}
