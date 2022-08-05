using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using Steam_Account_Manager.ViewModels.View;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.ViewModels
{
    internal class AccountTabViewModel : ObservableObject
    {
        public RelayCommand DeleteAccoundCommand { get; set; }
        public RelayCommand EditAccountCommand { get; set; }
        public RelayCommand OpenURLProfileCommand { get; set; }
        private string _steamPicture;
        private string _steamNickname;
        private ulong _steamID;
        private DateTime _accCreatedTime;
        private uint _steamLevel;
        private int _vacCount;
        private int _id;

        public uint SteamLevel
        {
            get { return _steamLevel; }
            set
            {
                _steamLevel = value;
                OnPropertyChanged(nameof(SteamLevel));
            }
        }

        public DateTime AccCreatedDate
        {
            get { return _accCreatedTime; }
            set
            {
                _accCreatedTime = value;
                OnPropertyChanged(nameof(AccCreatedDate));
            }
        }

        public ulong SteamID
        {
            get { return _steamID; }
            set
            {
                _steamID = value;
                OnPropertyChanged(nameof(SteamID));
            }
        }
        public string SteamPicture
        {
            get { return _steamPicture; }
            set
            {
                _steamPicture = value;
                OnPropertyChanged(nameof(SteamPicture));
            }
        }
        public string SteamNickName
        {
            get { return _steamNickname; }
            set
            {
                _steamNickname = value;
                OnPropertyChanged(nameof(SteamNickName));
            }
        }
        public int VacCount
        {
            get { return _vacCount; }
            set
            {
                _vacCount = value;
                OnPropertyChanged(nameof(VacCount));
            }
        }

        public int Id
        {
            get { return _id; }
            set
            {
                _id = value;
                OnPropertyChanged(nameof(Id));
            }
        }

        public AccountTabViewModel(int id)
        {
            Config config = Config.GetInstance();
            Account account = config.accountsDB.ElementAt(id);
            Id = id + 1;
            SteamPicture = account.avatarFull;
            SteamNickName = account.nickname;
            VacCount = account.vacBansCount;
            SteamID = account.steamID64;
            AccCreatedDate = account.accCreatedDate;
            SteamLevel = account.steamLevel;


            DeleteAccoundCommand = new RelayCommand(o =>
            {
                //MessageBox.Show("123");
                config.accountsDB.RemoveAt(id);
                config.SaveChanges();
                AccountsViewModel.FillAccountTabViews();
            });

            OpenURLProfileCommand = new RelayCommand(o =>
            {
                Process.Start(new ProcessStartInfo("https://steamcommunity.com/profiles/" + SteamID.ToString()) { UseShellExecute = true });
            });

            DeleteAccoundCommand = new RelayCommand(o =>
            {
                AccountsViewModel.RemoveAccount(id);
                
            });
        }
    }
}
