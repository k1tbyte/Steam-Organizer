using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels
{
    internal class AccountDataViewModel : ObservableObject
    {
        public RelayCommand CancelCommand { get; set; }
        public RelayCommand CopyCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }

        private string _avatarFull, _nickname;
        private bool _copyNotice = false;
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
                OnPropertyChanged(nameof(Password));
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
        public bool CopyNotice
        {
            get => _copyNotice;
            set
            {
                _copyNotice = value;
                OnPropertyChanged(nameof(CopyNotice));
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
        private async Task CopyNoticeView()
        {
            CopyNotice = true;
            Thread.Sleep(2000);
            CopyNotice = false;
        }

        public AccountDataViewModel(int id)
        {
            Config config = Config.GetInstance();
            Account currentAccount = config.AccountsDb[id];

            //Player summaries
            AvatarFull = currentAccount.AvatarFull;
            Nickname = currentAccount.Nickname;
            SteamID32 = ulong.Parse(currentAccount.SteamId64)-76561197960265728;
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
            PlayedPercent = GamesPlayed != null ? " ("+(float.Parse(GamesPlayed.Replace(",", string.Empty)) / float.Parse(GamesTotal.Replace(",", String.Empty)) * 100).ToString("#.#")+ "%)" : "0";

            //Bans info
            VacCount = currentAccount.VacBansCount;
            CommunityBan = currentAccount.CommunityBan;
            TradeBan = currentAccount.TradeBan;
            DaysSinceLastBan = currentAccount.DaysSinceLastBan;


            CancelCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountsViewCommand.Execute(null);
            });

            CopyCommand = new RelayCommand(o =>
            {
                var box = o as TextBox;
                box.SelectAll();
                box.Copy();
                Task.Run(() => CopyNoticeView());
            });

            OpenUrlProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo(SteamURL) { UseShellExecute = true }))
                {
                    ;
                }
            });
        }
    }
}
