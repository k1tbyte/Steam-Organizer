﻿using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using Steam_Account_Manager.Infrastructure.Parsers;
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels
{
    internal class AccountDataViewModel : ObservableObject
    {
        public RelayCommand CancelCommand { get; set; }
        public RelayCommand CopyCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }
        public RelayCommand TakeCsgoStatsInfo { get; set; }
        public RelayCommand SaveChangesComamnd { get; set; }
        public RelayCommand OpenOtherLinksCommand { get; set; }
        public AsyncRelayCommand RefreshCommand { get; set; }

        private Account currentAccount;
        private Config config;

        private string _avatarFull, _nickname;
        private bool _noticeView = false, _savePermission = false, _isCsgoStatsSave = false, _rankRefreshPermission = true;
        private string _steamLevel, _steamURL, _steamId64;
        private ulong _steaId32;
        private string _login, _password;
        private DateTime _createdDate;
        private string _profileVisiblity;
        private string _steamYearPicture;
        private string _gameCountPicture, _createdDatePicture;

        //bans
        private uint _vacCount, _daysSinceLastBan;
        private bool _tradeBan, _communityBan;

        //games
        private string _gamesTotal, _gamesPlayed, _hoursOnPlayed;
        private string _playedPercent;

        //csgostats
        private string _currentRank, _bestRank,
            _kills, _deaths, _KD , _playedMatches, _matchesWon, _winrate, _totalShots, _headshots,
            _headshotsPercent, _shotsHit,_accuracy, _roundsPlayed;

        //eror and notify msgs
        private string _csgoParseError, _steamDataValidateError, _notifyMsg;

        //other account info
        private string _note, _emailLogin, _emailPass, _rockstarEmail, _rockstarPass, _uplayEmail, _uplayPass;

        public string Note
        {
            get => _note;
            set
            {
                _note = value;
                OnPropertyChanged(nameof(Note));
            }
        }
        public string EmailLogin
        {
            get => _emailLogin;
            set
            {
                _emailLogin = value;
                OnPropertyChanged(nameof(EmailLogin));
            }
        }
        public string EmailPass
        {
            get => _emailPass;
            set
            {
                _emailPass = value;
                OnPropertyChanged(nameof(EmailPass));
            }
        }
        public string RockstarEmail
        {
            get => _rockstarEmail;
            set
            {
                _rockstarEmail = value;
                OnPropertyChanged(nameof(RockstarEmail));
            }
        }
        public string RockstarPass
        {
            get => _rockstarPass;
            set
            {
                _rockstarPass = value;
                OnPropertyChanged(nameof(RockstarPass));
            }
        }
        public string UplayEmail
        {
            get => _uplayEmail;
            set
            {
                _uplayEmail = value;
                OnPropertyChanged(nameof(UplayEmail));
            }
        }
        public string UplayPass
        {
            get => _uplayPass;
            set
            {
                _uplayPass = value;
                OnPropertyChanged(nameof(UplayPass));
            }
        }

        public string NotifyMsg
        {
            get => _notifyMsg;
            set
            {
                _notifyMsg = value;
                OnPropertyChanged(nameof(NotifyMsg));
            }
        }
        public string SteamDataValidateError
        {
            get => _steamDataValidateError;
            set
            {
                _steamDataValidateError = value;
                OnPropertyChanged(nameof(SteamDataValidateError));
            }
        }
        public string CsgoParseError
        {
            get => _csgoParseError;
            set
            {
                _csgoParseError = value;
                OnPropertyChanged(nameof(CsgoParseError));
            }
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
            set
            {
                _tradeBan = value;
                OnPropertyChanged(nameof(TradeBan));
            }
        }
        public bool CommunityBan
        {
            get => _communityBan;
            set
            {
                _communityBan = value;
                OnPropertyChanged(nameof(CommunityBan));
            }
        }

        public uint VacCount 
        {
            get => _vacCount;
            set
            {
                _vacCount = value;
                OnPropertyChanged(nameof(VacCount));
            }
        }

        public string GameCountPicture
        {
            get => _gameCountPicture;
            set
            {
                _gameCountPicture = value;
                OnPropertyChanged(nameof(GameCountPicture));
            }
        }

        public string CreatedDatePicuture
        {
            get => _createdDatePicture;
            set
            {
                _createdDatePicture = value;
                OnPropertyChanged(nameof(CreatedDatePicuture));
            }
        }
        public string ProfileVisiblity
        {
            get => _profileVisiblity;
            set
            {
                _profileVisiblity = value;
                OnPropertyChanged(nameof(ProfileVisiblity));
            }
        }
        public string SteamYearPicture
        {
            get => _steamYearPicture;
            set
            {
                _steamYearPicture = value;
                OnPropertyChanged(nameof(SteamYearPicture));
            }
        }

        public DateTime CreatedDate
        {
            get => _createdDate;
            set
            {
                _createdDate = value;
                OnPropertyChanged(nameof(CreatedDate));
            }
        }
        public string Login
        {
            get => _login;
            set
            {
                _login = value;
                OnPropertyChanged(nameof(Login));
            }
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
            set
            {
                _steaId32 = value;
                OnPropertyChanged(nameof(SteamID32));
            }
        }
        public string SteamID64
        {
            get => _steamId64;
            set
            {
                _steamId64 = value;
                OnPropertyChanged(nameof(SteamID64));
            }
        }
        public string SteamURL
        {
            get => _steamURL;
            set
            {
                _steamURL = value;
                OnPropertyChanged(nameof(SteamURL));
            }
        }
        public string SteamLevel
        {
            get => _steamLevel;
            set
            {
                _steamLevel = value;
                OnPropertyChanged(nameof(SteamLevel));
            }
        }
        public bool NoticeView
        {
            get => _noticeView;
            set
            {
                _noticeView = value;
                OnPropertyChanged(nameof(NoticeView));
            }
        }
        public string AvatarFull
        {
            get => _avatarFull;
            set
            {
                _avatarFull = value;
                OnPropertyChanged(nameof(AvatarFull));
            }
        }
        public string Nickname
        {
            get => _nickname;
            set
            {
                _nickname = value;
                OnPropertyChanged(nameof(Nickname));
            }
        }

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
            //Player summaries
            AvatarFull = currentAccount.AvatarFull;
            Nickname = currentAccount.Nickname;
            SteamID32 = ulong.Parse(currentAccount.SteamId64) - 76561197960265728;
            SteamID64 = currentAccount.SteamId64;
            SteamURL = currentAccount.ProfileURL;
            Login = currentAccount.Login;
            Password = currentAccount.Password;
            CreatedDate = currentAccount.AccCreatedDate;
            ProfileVisiblity = currentAccount.ProfileVisility == true ? "Public" : "Private";
            CreatedDatePicuture = currentAccount.CreatedDateImageUrl;

            //Games info
            SteamLevel = currentAccount.SteamLevel;
            GameCountPicture = currentAccount.CountGamesImageUrl;
            GamesTotal = currentAccount.TotalGames;
            GamesPlayed = currentAccount.GamesPlayed;
            HoursOnPlayed = currentAccount.HoursOnPlayed;
            PlayedPercent = currentAccount.ProfileVisility == true ? " (" + (float.Parse(GamesPlayed.Replace(",", string.Empty)) / float.Parse(GamesTotal.Replace(",", String.Empty)) * 100).ToString("#.#") + "%)" : "-";

            //Bans info
            VacCount = currentAccount.VacBansCount;
            CommunityBan = currentAccount.CommunityBan;
            TradeBan = currentAccount.TradeBan;
            DaysSinceLastBan = currentAccount.DaysSinceLastBan;

            //Other info
            Note = currentAccount.Note;
            EmailLogin = currentAccount.EmailLogin;
            EmailPass = currentAccount.EmailPass;
            RockstarEmail = currentAccount.RockstarEmail;
            RockstarPass = currentAccount.RockstarPass;
            UplayEmail = currentAccount.UplayEmail;
            UplayPass = currentAccount.UplayPass;
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

        private async Task BorderNoticeView(string message)
        {
            NotifyMsg = message;
            NoticeView = true;
            Thread.Sleep(2000);
            NoticeView = false;
        }

        private async Task CsgoStatsParse()
        {
            _rankRefreshPermission = false;
            var csgo_parser = new CsgoParser(_steamId64);
            CsgoParseError = "Gathering rank data...";
            csgo_parser.RankParse();
            CsgoParseError = "Gathering statistics...";
            if(csgo_parser.GlobalStatsParse())
            {
                currentAccount.CsgoStats = csgo_parser.GetCsgoStats;
                FillCsgoInfo();

                _isCsgoStatsSave = true;
                if (!_savePermission) _savePermission = true;

                CsgoParseError = "Player data has been updated!";
                Thread.Sleep(2000);
                CsgoParseError = "";
                
            }
            else
            {
                CsgoParseError = "The server error, please try again...";
                Thread.Sleep(2000);
                CsgoParseError = "";
            }
            _rankRefreshPermission = true;

        }

        private async Task RefreshAccount(int id)
        {
            if (MainWindowViewModel.NetworkConnectivityCheck())
            {
                var task = Task.Factory.StartNew(() =>
                {
                    currentAccount = new Account(currentAccount.Login, currentAccount.Password, currentAccount.SteamId64)
                    {
                        CsgoStats = currentAccount.CsgoStats,
                        Note = currentAccount.Note,
                        EmailLogin = currentAccount.EmailLogin,
                        EmailPass = currentAccount.EmailPass,
                        RockstarEmail = currentAccount.RockstarEmail,
                        RockstarPass = currentAccount.RockstarPass,
                        UplayEmail = currentAccount.UplayEmail,
                        UplayPass = currentAccount.UplayPass
                    };

                    config.AccountsDb[id] = currentAccount;
                    config.SaveChanges();
                    Task.Run(() => BorderNoticeView("Information updated"));
                    FillSteamInfo();
                });
                await task;
            }
        }
        public AccountDataViewModel(int id)
        {
            config = Config.GetInstance();
            currentAccount = config.AccountsDb[id];
            FillSteamInfo();
            FillCsgoInfo();


            CancelCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountsViewCommand.Execute(null);
                AccountsViewModel.FillAccountTabViews();
            });

            CopyCommand = new RelayCommand(o =>
            {
                var box = o as TextBox;
                box.SelectAll();
                box.Copy();
                Task.Run(() => BorderNoticeView("Copied to clipboard"));
            });

            OpenUrlProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo(SteamURL) { UseShellExecute = true }))
                {
                    ;
                }
            });

            TakeCsgoStatsInfo = new RelayCommand(o =>
            {
               if(currentAccount.ProfileVisility && _rankRefreshPermission)
                    Task.Run(() => CsgoStatsParse());
            });

            SaveChangesComamnd = new RelayCommand(o =>
            {
                if (!_isCsgoStatsSave && (!_savePermission || (Password == currentAccount.Password && 
                Login == currentAccount.Login && Note == currentAccount.Note && EmailLogin == currentAccount.EmailLogin &&
                RockstarEmail == currentAccount.RockstarEmail &&  RockstarPass == currentAccount.RockstarPass &&
                UplayEmail == currentAccount.UplayEmail && UplayPass == currentAccount.UplayPass))) { }

                else if (Login == "")
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_login_empty");
                }

                else if (Login.Contains(" "))
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_login_contain_spaces");
                }

                else if (Login.Length < 3)
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_login_shortage");
                }

                else if (Login.Length > 20)
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_login_overflow");
                }

                else if (Password == "")
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_pass_empty");
                }

                else if (Password.Length < 8)
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_pass_shortage");
                }

                else if (Password.Length > 50)
                {
                    SteamDataValidateError = (string)Application.Current.FindResource("adv_error_pass_overflow");
                }
                else
                {
                    _savePermission = false;
                    if(_isCsgoStatsSave)
                    {
                        config.AccountsDb[id].CsgoStats = currentAccount.CsgoStats;
                        _isCsgoStatsSave = false;
                    }
                    config.AccountsDb[id].Password = Password;
                    config.AccountsDb[id].Login = Login;
                    config.AccountsDb[id].Note = Note;
                    config.AccountsDb[id].EmailLogin = EmailLogin;
                    config.AccountsDb[id].EmailPass = EmailPass;
                    config.AccountsDb[id].RockstarEmail = RockstarEmail;
                    config.AccountsDb[id].RockstarPass = RockstarPass;
                    config.AccountsDb[id].UplayEmail = UplayEmail;
                    config.AccountsDb[id].UplayPass = UplayPass;
                    config.SaveChanges();
                    Task.Run(() => BorderNoticeView("Account changes saved"));

                }
                
            });

            RefreshCommand = new AsyncRelayCommand(async (o) => await RefreshAccount(id));

            OpenOtherLinksCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo(SteamURL + (string)o) { UseShellExecute = true }))
                {
                    ;
                }

            });
        }
    }
}
