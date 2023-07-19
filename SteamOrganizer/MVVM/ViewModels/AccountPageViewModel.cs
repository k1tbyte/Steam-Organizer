using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using System;
using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI.WebControls;
using System.Windows;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountPageViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand CopyAccountURLCommand { get; }
        public RelayCommand OpenAccountURLCommand { get; }
        public RelayCommand OpenOtherURLCommand { get; }
        public RelayCommand BackCommand { get; }
        public AsyncRelayCommand UpdateCommand { get; }
        public AsyncRelayCommand CopySteamIDCommand { get; }
        #endregion


        #region Properties

        public BitmapImage FullAvatar { get; private set; }
        public int SelectedTabIndex { get; set; }
        public bool IsPasswordShown { get; set; }

        public Visibility AdditionalControlsVis { get; private set; } = Visibility.Visible;

        private string _yearImagePath;
        public string YearImagePath
        {
            get => _yearImagePath;
            private set => SetProperty(ref _yearImagePath, value);
        }

        private string _gamesImagePath;
        public string GamesImagePath
        {
            get => _gamesImagePath;
            private set => SetProperty(ref _gamesImagePath, value);
        }

        private string _gamesDetails;
        public string GamesDetails 
        {
            get => _gamesDetails;
            private set => SetProperty(ref _gamesDetails, value);
        }

        private string _gameBanDetails;
        public string GameBanDetails 
        {
            get => _gameBanDetails;
            private set => SetProperty(ref _gameBanDetails, value);
        }

        private string _economyBanDetails;
        public string EconomyBanDetails
        {
            get => _economyBanDetails;
            private set => SetProperty(ref _economyBanDetails, value);
        }

        private string _vacBanDetails;
        public string VacBanDetails
        {
            get => _vacBanDetails;
            private set => SetProperty(ref _vacBanDetails, value);
        }

        private string _steamCredentialsErr;
        public string SteamCrenetialsErr
        {
            get => _steamCredentialsErr;
            set => SetProperty(ref _steamCredentialsErr, value);
        }


        public int SelectedSteamIDType
        {
            set
            {
                if (CurrentAccount.SteamID64 == null || value < 0)
                {
                    return;
                }

                if (value >= 6)
                {
                    SteamIDField = CurrentAccount.VanityURL;
                }
                else
                {
                    SteamIDField = SteamIdConverter.FromSteamID64(CurrentAccount.SteamID64.Value, (SteamIdConverter.ESteamIDType)value);
                }

                OnPropertyChanged(nameof(SteamIDField));
            }
        }
        public string SteamIDField { get; private set; }

        private string _passwordTemp;
        public string Password
        {
            get => _passwordTemp;
            set
            {
                _passwordTemp = value;
                ValidateCredentials();
            }
        }

        private string _loginTemp;
        public string Login
        {
            get => _loginTemp;
            set
            {
                _loginTemp = value;
                ValidateCredentials();
            }

        }

        public Account CurrentAccount { get; }
        #endregion



        private void ValidateCredentials()
        {
            if (string.IsNullOrEmpty(_loginTemp))
            {
                SteamCrenetialsErr = App.FindString("adv_err_login_empty");
            }
            else if (_loginTemp.Contains(" "))
            {
                SteamCrenetialsErr = App.FindString("adv_err_login_spaces");
            }
            else if (_loginTemp.Length < 3 || _loginTemp.Length > 32)
            {
                SteamCrenetialsErr = App.FindString("adv_err_login_len");
            }
            else if (string.IsNullOrEmpty(_passwordTemp))
            {
                SteamCrenetialsErr = App.FindString("adv_err_pass_empty");
            }
            else if (_passwordTemp.Length < 6 || _passwordTemp.Length > 50)
            {
                SteamCrenetialsErr = App.FindString("adv_err_pass_len");
            }
            else
            {
                if (!String.IsNullOrEmpty(_steamCredentialsErr))
                {
                    SteamCrenetialsErr = null;
                }

                CurrentAccount.Password = _passwordTemp;
                CurrentAccount.Login    = _loginTemp;

                App.Config.SaveDatabase(3000);
            }
        }

        private void InitBansInfo()
        {
            if(CurrentAccount.DaysSinceLastBan == 0)
            {
                return;
            }

            if (CurrentAccount.GameBansCount >= 1)
            {
                GameBanDetails = "This account has a game ban"
                    + (CurrentAccount.GameBansCount == 1 ? null : $" in several games ({CurrentAccount.GameBansCount})");
            }

            if (CurrentAccount.VacBansCount >= 1)
            {
                VacBanDetails = "This account has been banned by VAC"
                    + (CurrentAccount.VacBansCount == 1 ? null : $" in several games ({CurrentAccount.VacBansCount})");
            }

            if (CurrentAccount.EconomyBan != 0)
            {
                EconomyBanDetails = (CurrentAccount.EconomyBan == 1 ? "The account is temporarily blocked." :
                    "The account is permanently banned.") + " Trade/exchange/sending of gifts is prohibited on this account";
            }
        }

        private void InitGamesInfo()
        {
            if (CurrentAccount.GamesCount <= 0)
                return;

            GamesImagePath = $"/Resources/Images/SteamGamesBadges/{CurrentAccount.GamesBadgeBoundary}.png";
            GamesDetails = CurrentAccount.PlayedGamesCount <= 0 ? "0" :
                new StringBuilder().Append(CurrentAccount.PlayedGamesCount).Append(" (")
                .AppendFormat(CultureInfo.InvariantCulture, "{0:P1}", (float)CurrentAccount.PlayedGamesCount / CurrentAccount.GamesCount).Append(") ")
                .AppendFormat(CultureInfo.InvariantCulture, "{0:n1}", CurrentAccount.HoursOnPlayed).Append(" h").ToString();
        }

        private void InitAvatar()
        {
            Utils.InBackground(() =>
            {
                FullAvatar = CachingManager.GetCachedAvatar(CurrentAccount.AvatarHash, 0, 0, size: EAvatarSize.full);
                App.STAInvoke(() => OnPropertyChanged(nameof(FullAvatar)));
            });
        }

        private void Init()
        {
            if (CurrentAccount.AccountID == null)
            {
                AdditionalControlsVis = Visibility.Collapsed;
                return;
            }

            InitAvatar();
            InitYearsOfService();
            InitGamesInfo();
            InitBansInfo();
        }

        private void InitYearsOfService()
        {
            if (CurrentAccount.YearsOfService >= 1f)
            {
                YearImagePath = $"/Resources/Images/SteamYearsBadges/year{(int)CurrentAccount.YearsOfService}.bmp";
            }
        }

        private async Task OnCopyingSteamID(object param)
        {
            Clipboard.SetDataObject(SteamIDField);
            await Utils.OpenAutoClosableToolTip(param as FrameworkElement, App.FindString("copied_info"));
        }

        private async Task OnAccountUpdating(object param)
        {
            if (!await CurrentAccount.RetrieveInfo(true))
            {
                return;
            }

            Init();
            OnPropertyChanged(nameof(CurrentAccount));
            App.Config.SaveDatabase();
        }

        public AccountPageViewModel(Account account)
        {
            BackCommand           = new RelayCommand((o) => App.MainWindowVM.CurrentView = App.MainWindowVM.Accounts);
            CopyAccountURLCommand = new RelayCommand((o) => Clipboard.SetDataObject(CurrentAccount.GetProfileUrl()));
            OpenAccountURLCommand = new RelayCommand((o) => CurrentAccount.OpenInBrowser());
            OpenOtherURLCommand   = new RelayCommand((o) => CurrentAccount.OpenInBrowser($"/{o}"));
            CopySteamIDCommand    = new AsyncRelayCommand(OnCopyingSteamID);
            UpdateCommand         = new AsyncRelayCommand(OnAccountUpdating);


            this.CurrentAccount = account;
            _passwordTemp       = CurrentAccount.Password;
            _loginTemp          = CurrentAccount.Login;
            Init();
        }
    }
}
