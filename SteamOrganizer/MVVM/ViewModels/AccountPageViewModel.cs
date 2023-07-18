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
        public AsyncRelayCommand CopySteamIDCommand { get; }
        #endregion


        #region Properties
        private static readonly ushort[] GamesBadgeBoundaries = {
                1,5,10,25,50,100,250,500,1000,2000,3000,4000,5000,6000,7000,8000,8000,9000,10000,11000,13000,14000,15000,16000,17000,18000,20000,21000,
                22000,23000,24000,25000,26000,27000,28000,29000,30000,31000,32000
             };


        public BitmapImage FullAvatar { get; private set; }
        public string YearImagePath { get; private set; }
        public string GamesImagePath { get; private set; }
        public int SelectedTabIndex { get; set; }
        public bool IsPasswordsShown { get; set; } = true;

        public Visibility AdditionalControlsVis { get; private set; } = Visibility.Visible;
        public string GamesDetails { get; private set; }
        public string GameBanDetails { get; private set; }
        public string EconomyBanDetails { get; private set; }
        public string VacBanDetails { get; private set; }
        public string SteamIDField { get; private set; }

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

        private string _steamCredentialsErr;
        public string SteamCrenetialsErr
        {
            get => _steamCredentialsErr;
            set => SetProperty(ref _steamCredentialsErr,value);
        }

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
            }
        }

        private void UpdateGamesImage()
        {
            if (CurrentAccount.GamesCount > GamesBadgeBoundaries[GamesBadgeBoundaries.Length - 2])
            {
                GamesImagePath = $"/Resources/Images/SteamGamesBadges/{GamesBadgeBoundaries[GamesBadgeBoundaries.Length - 1]}.png";
                return;
            }

            for (int i = 0; i < GamesBadgeBoundaries.Length-1; i++)
            {
                if(CurrentAccount.GamesCount == GamesBadgeBoundaries[i] || CurrentAccount.GamesCount < GamesBadgeBoundaries[i + 1])
                {
                    GamesImagePath = $"/Resources/Images/SteamGamesBadges/{GamesBadgeBoundaries[i]}.png";
                    break;
                }
            }
        }

        private void Init()
        {
            Utils.InBackground(() => 
            {
                FullAvatar = CachingManager.GetCachedAvatar(CurrentAccount.AvatarHash, 0, 0, size: EAvatarSize.full);
                App.STAInvoke(() => OnPropertyChanged(nameof(FullAvatar)));
            });

            if(CurrentAccount.AccountID == null)
            {
                AdditionalControlsVis = Visibility.Collapsed;
                return;
            }

            if (CurrentAccount.YearsOfService >= 1f)
            {
                YearImagePath = $"/Resources/Images/SteamYearsBadges/year{(int)CurrentAccount.YearsOfService}.bmp";
            }

            if (CurrentAccount.GamesCount > 0)
            {
                UpdateGamesImage();
                GamesDetails = CurrentAccount.PlayedGamesCount <= 0 ? "0" :
                    new StringBuilder().Append(CurrentAccount.PlayedGamesCount).Append(" (")
                    .AppendFormat(CultureInfo.InvariantCulture, "{0:P1}", (float)CurrentAccount.PlayedGamesCount / CurrentAccount.GamesCount).Append(") ")
                    .AppendFormat(CultureInfo.InvariantCulture, "{0:n1}", CurrentAccount.HoursOnPlayed).Append(" h").ToString();
            }


            if(CurrentAccount.GameBansCount >= 1)
            {
                GameBanDetails = "This account has a game ban" 
                    + (CurrentAccount.GameBansCount == 1 ? null : $" in several games ({CurrentAccount.GameBansCount})");
            }

            if (CurrentAccount.VacBansCount >= 1)
            {
                VacBanDetails = "This account has been banned by VAC"
                    + (CurrentAccount.VacBansCount == 1 ? null : $" in several games ({CurrentAccount.VacBansCount})"); 
            }

            if(CurrentAccount.EconomyBan != 0)
            {
                EconomyBanDetails = (CurrentAccount.EconomyBan == 1 ? "The account is temporarily blocked." :
                    "The account is permanently banned.") + " Trade/exchange/sending of gifts is prohibited on this account";
            }

            _passwordTemp = CurrentAccount.Password;
            _loginTemp    = CurrentAccount.Login;

            IsPasswordsShown = false;
            OnPropertyChanged(nameof(IsPasswordsShown));
        }

        private async Task OnCopyingSteamID(object param)
        {
            Clipboard.SetDataObject(SteamIDField);
            await Utils.OpenAutoClosableToolTip(param as FrameworkElement, App.FindString("copied_info"));
        }

        public AccountPageViewModel(Account account)
        {
            this.CurrentAccount = account;
            Init();

            BackCommand           = new RelayCommand((o) => App.MainWindowVM.CurrentView = App.MainWindowVM.Accounts);
            CopyAccountURLCommand = new RelayCommand((o) => Clipboard.SetDataObject(CurrentAccount.GetProfileUrl()));
            OpenAccountURLCommand = new RelayCommand((o) => CurrentAccount.OpenInBrowser());
            OpenOtherURLCommand   = new RelayCommand((o) => CurrentAccount.OpenInBrowser($"/{o}"));
            CopySteamIDCommand    = new AsyncRelayCommand(OnCopyingSteamID);
        }
    }
}
