using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using System;
using System.Diagnostics;
using System.Linq;

namespace Steam_Account_Manager.ViewModels
{
    internal class AccountTabViewModel : ObservableObject
    {
        public RelayCommand DeleteAccoundCommand { get; set; }
        public RelayCommand EditOrViewAccountCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }

        private string _steamPicture;
        private string _steamNickname;
        private string _steamId;
        private DateTime _accCreatedTime;
        private string _steamLevel;
        private uint _vacCount;
        private int _id;

        public string SteamLevel
        {
            get => _steamLevel;
            set
            {
                _steamLevel = value;
                OnPropertyChanged();
            }
        }

        public DateTime AccCreatedDate
        {
            get => _accCreatedTime;
            set
            {
                _accCreatedTime = value;
                OnPropertyChanged();
            }
        }

        public string SteamId
        {
            get => _steamId;
            set
            {
                _steamId = value;
                OnPropertyChanged();
            }
        }

        public string SteamPicture
        {
            get => _steamPicture;
            set
            {
                _steamPicture = value;
                OnPropertyChanged();
            }
        }

        public string SteamNickName
        {
            get => _steamNickname;
            set
            {
                _steamNickname = value;
                OnPropertyChanged();
            }
        }

        public uint VacCount
        {
            get => _vacCount;
            set
            {
                _vacCount = value;
                OnPropertyChanged();
            }
        }

        public int Id
        {
            get => _id;
            set
            {
                _id = value;
                OnPropertyChanged();
            }
        }

        public AccountTabViewModel(int id)
        {
            Config config = Config.GetInstance();
            Account account = config.AccountsDb.ElementAt(id);
            Id = id + 1;
            SteamPicture = account.AvatarFull;
            SteamNickName = account.Nickname;
            VacCount = account.VacBansCount;
            SteamId = account.SteamId64;
            AccCreatedDate = account.AccCreatedDate;
            SteamLevel = account.SteamLevel;


            DeleteAccoundCommand = new RelayCommand(o =>
            {
                config.AccountsDb.RemoveAt(id);
                config.SaveChanges();
                AccountsViewModel.FillAccountTabViews();
            });

            EditOrViewAccountCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountDataViewCommand.Execute(id);
            });

            OpenUrlProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo("https://steamcommunity.com/profiles/" + SteamId.ToString()) { UseShellExecute = true }))
                {
                    ;
                }
            });

            DeleteAccoundCommand = new RelayCommand(o =>
            {
                if (!config.NoConfirmMode)
                    AccountsViewModel.RemoveAccount(ref id);
                else
                {
                    config.AccountsDb.RemoveAt(id);
                    config.SaveChanges();
                    AccountsViewModel.FillAccountTabViews();
                }
            });
        }
    }
}
