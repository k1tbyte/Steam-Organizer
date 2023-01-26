using Microsoft.Win32;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
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
        public RelayCommand CancelCommand { get; set; }
        public RelayCommand CopyCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }
        public RelayCommand OpenFromIdLinkCommand { get; set; }
        public AsyncRelayCommand TakeCsgoStatsInfo { get; set; }
        public RelayCommand SaveChangesComamnd { get; set; }
        public RelayCommand OpenOtherLinksCommand { get; set; }
        public RelayCommand ExportAccountCommand { get; set; }
        public RelayCommand AddAuthenticatorCommand { get; set; }
        public RelayCommand YesAuthenticatorCommand { get; set; }
        public AsyncRelayCommand RefreshCommand { get; set; }

        private Account currentAccount;
        public Account CurrentAccount => currentAccount;

        private string  _nickname;
        private bool _noticeView = false, _savePermission = false, _isCsgoStatsSave = false;
        private string _steamLevel, _steamURL, _steamId64;
        private ulong _steaId32;
        private string _login, _password;
        private DateTime _createdDate, _lastUpdateTime;
        private string _profileVisiblity;
        private string _steamYearPicture;
        private string _gameCountPicture, _createdDatePicture;
        private bool _containParseInfo;
        private int _id;
        private string _authenticatorPath;

        //bans
        private int _vacCount;
        private uint _daysSinceLastBan;
        private bool _tradeBan, _communityBan;

        //games
        private string _gamesTotal, _gamesPlayed, _hoursOnPlayed;
        private string _playedPercent;

        //csgostats
        private string _currentRank, _bestRank,
            _kills, _deaths, _KD, _playedMatches, _matchesWon, _winrate, _totalShots, _headshots,
            _headshotsPercent, _shotsHit, _accuracy, _roundsPlayed;

        //eror and notify msgs
        private string _csgoParseError, _steamDataValidateError, _notifyMsg;

        //other account info
        private string _note, _emailLogin, _emailPass, _rockstarEmail, _rockstarPass, _uplayEmail, _uplayPass, _originEmail, _originPass;

        #region Properties

        public DateTime LastUpdateTime
        {
            get => _lastUpdateTime;
            set => SetProperty(ref _lastUpdateTime, value);
        }
        public string AuthenticatorPath
        {
            get => _authenticatorPath;
            set => SetProperty(ref _authenticatorPath, value);
        }
        public bool ContainParseInfo
        {
            get => _containParseInfo;
            set => SetProperty(ref _containParseInfo, value);
        }
        public string Note
        {
            get => _note;
            set => SetProperty(ref _note, value);
        }
        public string EmailLogin
        {
            get => _emailLogin;
            set => SetProperty(ref _emailLogin, value);
        }
        public string EmailPass
        {
            get => _emailPass;
            set => SetProperty(ref _emailPass, value);
        }
        public string RockstarEmail
        {
            get => _rockstarEmail;
            set => SetProperty(ref _rockstarEmail, value);
        }
        public string RockstarPass
        {
            get => _rockstarPass;
            set => SetProperty(ref _rockstarPass, value);
        }
        public string UplayEmail
        {
            get => _uplayEmail;
            set => SetProperty(ref _uplayEmail, value);
        }
        public string UplayPass
        {
            get => _uplayPass;
            set => SetProperty(ref _uplayPass, value);
        }

        public string OriginEmail
        {
            get => _originEmail;
            set => SetProperty(ref _originEmail, value);
        }

        public string OriginPass
        {
            get => _originPass;
            set => SetProperty(ref _originPass, value);   
        }

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
        public string PlayedPercent
        {
            get => _playedPercent;
            set
            {
                _playedPercent = value;
            }
        }
        public string GamesTotal
        {
            get => _gamesTotal;
            set
            {
                _gamesTotal = value;
            }
        }
        public string GamesPlayed
        {
            get => _gamesPlayed;
            set
            {
                _gamesPlayed = value;
            }
        }
        public string HoursOnPlayed
        {
            get => _hoursOnPlayed;
            set
            {
                _hoursOnPlayed = value;
            }
        }

        public uint DaysSinceLastBan
        {
            get => _daysSinceLastBan;
            set
            {
                _daysSinceLastBan = value;
            }
        }
        public bool TradeBan
        {
            get => _tradeBan;
            set => SetProperty(ref _tradeBan, value);
        }
        public bool CommunityBan
        {
            get => _communityBan;
            set => SetProperty(ref _communityBan, value);
        }

        public int VacCount
        {
            get => _vacCount;
            set => SetProperty(ref _vacCount, value);
        }

        public string GameCountPicture
        {
            get => _gameCountPicture;
            set => SetProperty(ref _gameCountPicture, value);
        }

        public string CreatedDatePicuture
        {
            get => _createdDatePicture;
            set => SetProperty(ref _createdDatePicture, value);
        }
        public string ProfileVisiblity
        {
            get => _profileVisiblity;
            set => SetProperty(ref _profileVisiblity, value);
        }
        public string SteamYearPicture
        {
            get => _steamYearPicture;
            set => SetProperty(ref _steamYearPicture, value);
        }

        public DateTime CreatedDate
        {
            get => _createdDate;
            set => SetProperty(ref _createdDate, value);
        }
        public string Login
        {
            get => _login;
            set => SetProperty(ref _login, value);
        }
        public string Password
        {
            get => _password;
            set
            {
                _password = value;
                if (!_savePermission) _savePermission = true;
            }
        }
        public ulong SteamID32
        {
            get => _steaId32;
            set => SetProperty(ref _steaId32, value);
        }
        public string SteamID64
        {
            get => _steamId64;
            set => SetProperty(ref _steamId64, value);
        }
        public string SteamURL
        {
            get => _steamURL;
            set => SetProperty(ref _steamURL, value);
        }
        public string SteamLevel
        {
            get => _steamLevel;
            set => SetProperty(ref _steamLevel, value);
        }
        public bool NoticeView
        {
            get => _noticeView;
            set => SetProperty(ref _noticeView, value);
        }
        public string Nickname
        {
            get => _nickname;
            set => SetProperty(ref _nickname, value);
        }
        #endregion

        #region CsGo Statistics
        public string CurrentRank
        {
            get => _currentRank;
            set
            {
                _currentRank = value;
                OnPropertyChanged(nameof(CurrentRank));
            }
        }
        public string BestRank
        {
            get => _bestRank;
            set
            {
                _bestRank = value;
                OnPropertyChanged(nameof(BestRank));
            }
        }
        public string Kills
        {
            get => _kills;
            set
            {
                _kills = value;
                OnPropertyChanged(nameof(Kills));
            }
        }
        public string Deaths
        {
            get => _deaths;
            set
            {
                _deaths = value;
                OnPropertyChanged(nameof(Deaths));
            }
        }
        public string KD
        {
            get => _KD;
            set
            {
                _KD = value;
                OnPropertyChanged(nameof(KD));
            }
        }
        public string PlayedMatches
        {
            get => _playedMatches;
            set
            {
                _playedMatches = value;
                OnPropertyChanged(nameof(PlayedMatches));
            }
        }
        public string MatchesWon
        {
            get => _matchesWon;
            set
            {
                _matchesWon = value;
                OnPropertyChanged(nameof(MatchesWon));
            }
        }
        public string Winrate
        {
            get => _winrate;
            set
            {
                _winrate = value;
                OnPropertyChanged(nameof(Winrate));
            }
        }
        public string TotalShots
        {
            get => _totalShots;
            set
            {
                _totalShots = value;
                OnPropertyChanged(nameof(TotalShots));
            }
        }
        public string Headshots
        {
            get => _headshots;
            set
            {
                _headshots = value;
                OnPropertyChanged(nameof(Headshots));
            }
        }
        public string HeadshotsPercent
        {
            get => _headshotsPercent;
            set
            {
                _headshotsPercent = value;
                OnPropertyChanged(nameof(HeadshotsPercent));
            }
        }
        public string ShotsHit
        {
            get => _shotsHit;
            set
            {
                _shotsHit = value;
                OnPropertyChanged(nameof(ShotsHit));
            }
        }
        public string Accuracy
        {
            get => _accuracy;
            set
            {
                _accuracy = value;
                OnPropertyChanged(nameof(Accuracy));
            }
        }
        public string RoundsPlayed
        {
            get => _roundsPlayed;
            set
            {
                _roundsPlayed = value;
                OnPropertyChanged(nameof(RoundsPlayed));
            }
        }
        #endregion

        private void FillSteamInfo()
        {
            Nickname = currentAccount.Nickname;
            Login = currentAccount.Login;
            Password = currentAccount.Password;
            ContainParseInfo = currentAccount.ContainParseInfo;
            LastUpdateTime = currentAccount.LastUpdateTime;

            if (currentAccount.ContainParseInfo)
            {
                //Player summaries
                SteamID32 = ulong.Parse(currentAccount.SteamId64) - 76561197960265728;
                SteamID64 = currentAccount.SteamId64;
                SteamURL = currentAccount.ProfileURL;
                CreatedDate = currentAccount.AccCreatedDate;
                ProfileVisiblity = currentAccount.ProfileVisility == true ? "Public" : "Private";
                CreatedDatePicuture = currentAccount.CreatedDateImageUrl;

                //Games info
                SteamLevel = currentAccount.SteamLevel;
                GameCountPicture = currentAccount.CountGamesImageUrl;
                GamesTotal = currentAccount.TotalGames;
                GamesPlayed = currentAccount.GamesPlayed;
                HoursOnPlayed = currentAccount.HoursOnPlayed;
                PlayedPercent = currentAccount.ProfileVisility == true && float.TryParse(GamesPlayed.Replace(",", string.Empty),out float games) ?
                    " (" + (games / float.Parse(GamesTotal.Replace(",", String.Empty)) * 100).ToString("#.#") + "%)" : "-";

                //Bans info
                VacCount = currentAccount.VacBansCount;
                CommunityBan = currentAccount.CommunityBan;
                TradeBan = currentAccount.TradeBan;
                DaysSinceLastBan = currentAccount.DaysSinceLastBan;
            }
            else
            {
                ProfileVisiblity = SteamURL = SteamID64 = "Unknown";
                GameCountPicture = CreatedDatePicuture = "/Images/Steam_years_of_service/year0.png";
                SteamLevel = "-";
                SteamID32 = 0;
            }

            //Other info
            Note = currentAccount.Note;
            EmailLogin = currentAccount.EmailLogin;
            EmailPass = currentAccount.EmailPass;
            RockstarEmail = currentAccount.RockstarEmail;
            RockstarPass = currentAccount.RockstarPass;
            UplayEmail = currentAccount.UplayEmail;
            UplayPass = currentAccount.UplayPass;
            OriginPass = currentAccount.OriginPass;
            OriginEmail = currentAccount.OriginEmail;


        }
        private void FillCsgoInfo()
        {
            //csgo info
            CurrentRank = currentAccount.CsgoStats.CurrentRank;
            BestRank = currentAccount.CsgoStats.BestRank;
            Kills = currentAccount.CsgoStats.Kills;
            Deaths = currentAccount.CsgoStats.Deaths;
            KD = currentAccount.CsgoStats.KD;
            PlayedMatches = currentAccount.CsgoStats.PlayedMatches;
            MatchesWon = currentAccount.CsgoStats.MatchesWon;
            Winrate = currentAccount.CsgoStats.Winrate;
            TotalShots = currentAccount.CsgoStats.TotalShots;
            Headshots = currentAccount.CsgoStats.Headshots;
            HeadshotsPercent = currentAccount.CsgoStats.HeadshotPercent;
            ShotsHit = currentAccount.CsgoStats.ShotsHit;
            Accuracy = currentAccount.CsgoStats.Accuracy;
            RoundsPlayed = currentAccount.CsgoStats.RoundsPlayed;
        }

        private async void BorderNoticeView(string message)
        {
            NotifyMsg = message;
            NoticeView = true;
            await Task.Delay(2000).ConfigureAwait(false);
            NoticeView = false;
        }

        private async Task CsgoStatsParse()
        {
            try
            {
                var csgo_parser = new CsgoParser(_steamId64);
                CsgoParseError = App.FindString("adat_cs_inf_takeStats");
                if (!await csgo_parser.GlobalStatsParse())
                {
                    CsgoParseError = App.FindString("adat_cs_inf_errortakeStats");
                    await Task.Delay(2000);
                    CsgoParseError = "";
                    return;
                }
                CsgoParseError = App.FindString("adat_cs_inf_takeRank");
                await csgo_parser.RankParse();

                currentAccount.CsgoStats = csgo_parser.GetCsgoStats;
                FillCsgoInfo();

                _isCsgoStatsSave = true;
                if (!_savePermission) _savePermission = true;
                CsgoParseError = App.FindString("adat_cs_inf_updSucces");
                await Task.Delay(2000);
                CsgoParseError = "";
            }
            catch
            {
                CsgoParseError = App.FindString("adat_cs_inf_serverError");
                await Task.Delay(2000);
                CsgoParseError = "";
            }
        }

        private async Task RefreshAccount(int id)
        {
            await Task.Factory.StartNew(() =>
            {
                try
                {
                    currentAccount = new Account(
                        currentAccount.Login,
                        currentAccount.Password,
                        currentAccount.SteamId64,
                        currentAccount.Note,
                        currentAccount.EmailLogin,
                        currentAccount.EmailPass,
                        currentAccount.RockstarEmail,
                        currentAccount.RockstarPass,
                        currentAccount.UplayEmail,
                        currentAccount.UplayPass,
                        currentAccount.OriginEmail,
                        currentAccount.OriginPass,
                        currentAccount.CsgoStats,
                        currentAccount.AuthenticatorPath,
                        currentAccount.Nickname
                        );

                    Config.Accounts[id] = currentAccount;
                    Config.SaveAccounts();
                    Task.Run(() => BorderNoticeView(App.FindString("adat_cs_inf_updated"))).ConfigureAwait(false);
                    FillSteamInfo();
                }
                catch
                {
                    Task.Run(() => BorderNoticeView(App.FindString("adat_cs_inf_noInternet"))).ConfigureAwait(false);
                }

            });
        }

        private void OpenAddAuthenticatorWindow()
        {
            Utils.Presentation.OpenDialogWindow(new AddAuthenticatorWindow(Login, Password, _id));
        }

        public void OpenShowAuthenticatorWindow()
        {
            Utils.Presentation.OpenDialogWindow(new ShowAuthenticatorWindow(_id));
        }


        public AccountDataViewModel(int id)
        {
            currentAccount = Config.Accounts[id];
            FillSteamInfo();
            if (currentAccount.ContainParseInfo) FillCsgoInfo();
            _id = id;

            if (currentAccount.AuthenticatorPath != null) AuthenticatorPath = currentAccount.AuthenticatorPath;

            CancelCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountsViewCommand.Execute(true);
                AccountsViewModel.UpdateAccountTabView(id);
            });

            CopyCommand = new RelayCommand(o =>
            {
                var box = o as TextBox;
                box.SelectAll();
                box.Copy();
                Task.Run(() => BorderNoticeView(App.FindString("adat_notif_copiedClipoard"))).ConfigureAwait(false);
            });

            OpenUrlProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo(SteamURL) { UseShellExecute = true })) { };
            });

            TakeCsgoStatsInfo = new AsyncRelayCommand(async (o) =>
            {
                if(!Utils.Common.CheckInternetConnection())
                {
                    CsgoParseError = App.FindString("adat_cs_inf_noInternet");
                    await Task.Delay(2000);
                    return;
                }
                else if (currentAccount.ProfileVisility && GamesPlayed != "-")
                {
                    await CsgoStatsParse();
                } 
                else
                {
                    CsgoParseError = App.FindString("adat_cs_inf_profilePrivateOrNullGames");
                    await Task.Delay(2000);
                    CsgoParseError = "";
                    return;
                }

            });

            SaveChangesComamnd = new RelayCommand(o =>
            {
                if (!_isCsgoStatsSave && (!_savePermission || (Password == currentAccount.Password &&
                Login == currentAccount.Login && Note == currentAccount.Note && EmailLogin == currentAccount.EmailLogin &&
                RockstarEmail == currentAccount.RockstarEmail && RockstarPass == currentAccount.RockstarPass &&
                UplayEmail == currentAccount.UplayEmail && UplayPass == currentAccount.UplayPass &&
                 OriginEmail == currentAccount.OriginEmail && OriginPass == currentAccount.OriginPass))) { }

                else if (Login == "")
                {
                    SteamDataValidateError = App.FindString("adv_error_login_empty");
                }

                else if (Login.Contains(" "))
                {
                    SteamDataValidateError = App.FindString("adv_error_login_contain_spaces");
                }

                else if (Login.Length < 3)
                {
                    SteamDataValidateError = App.FindString("adv_error_login_shortage");
                }

                else if (Login.Length > 32)
                {
                    SteamDataValidateError = App.FindString("adv_error_login_overflow");
                }

                else if (Password == "")
                {
                    SteamDataValidateError = App.FindString("adv_error_pass_empty");
                }

                else if (Password.Length < 6)
                {
                    SteamDataValidateError = App.FindString("adv_error_pass_shortage");
                }

                else if (Password.Length > 50)
                {
                    SteamDataValidateError = App.FindString("adv_error_pass_overflow");
                }
                else
                {
                    _savePermission = false;
                    if (_isCsgoStatsSave)
                    {
                        Config.Accounts[id].CsgoStats = currentAccount.CsgoStats;
                        _isCsgoStatsSave = false;
                    }
                    Config.Accounts[id].Password = Password;
                    Config.Accounts[id].Login = Login;
                    Config.Accounts[id].Note = Note;
                    Config.Accounts[id].EmailLogin = EmailLogin;
                    Config.Accounts[id].EmailPass = EmailPass;
                    Config.Accounts[id].RockstarEmail = RockstarEmail;
                    Config.Accounts[id].RockstarPass = RockstarPass;
                    Config.Accounts[id].UplayEmail = UplayEmail;
                    Config.Accounts[id].UplayPass = UplayPass;
                    Config.Accounts[id].OriginEmail = OriginEmail;
                    Config.Accounts[id].OriginPass = OriginPass;
                    Config.Accounts[id].AccCreatedDate = DateTime.Now;
                    Config.SaveAccounts();
                    Task.Run(() => BorderNoticeView(App.FindString("adat_notif_changesSaved")));

                }

            });

            RefreshCommand = new AsyncRelayCommand(async (o) => await RefreshAccount(id));

            OpenOtherLinksCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo(SteamURL + (string)o) { UseShellExecute = true })) { };
            });

            OpenFromIdLinkCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo((string)o + currentAccount.SteamId64) { UseShellExecute = true })) { };
            });

            ExportAccountCommand = new RelayCommand(o =>
            {
                var fileDialog = new SaveFileDialog
                {
                    Filter = "Steam Account (.sa)|*.sa"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    Config.Serialize(Config.Accounts[id], fileDialog.FileName, Config.Properties.UserCryptoKey);
                    Task.Run(() => BorderNoticeView((string)Application.Current.FindResource("adat_notif_accountExported")));
                }
            });

            AddAuthenticatorCommand = new RelayCommand(o =>
            {
                AuthenticatorPath = Config.Accounts[_id].AuthenticatorPath;
                if (AuthenticatorPath == null || !System.IO.File.Exists(AuthenticatorPath))
                {
                    var border = o as Border;
                    border.Visibility = Visibility.Visible;
                }
                else
                {
                    OpenShowAuthenticatorWindow();
                }
            });

            YesAuthenticatorCommand = new RelayCommand(o =>
            {
                OpenAddAuthenticatorWindow();
            });

        }
    }
}
