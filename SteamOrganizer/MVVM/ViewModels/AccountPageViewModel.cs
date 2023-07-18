using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Threading.Tasks;
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
                if (CurrentAccount.SteamID64 == null)
                    return;

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
        #endregion

        public Account CurrentAccount { get; }

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
            Utils.InBackground(() => FullAvatar = CachingManager.GetCachedAvatar(CurrentAccount.AvatarHash, 0, 0, size: EAvatarSize.full));
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

            CopyAccountURLCommand = new RelayCommand((o) => Clipboard.SetDataObject(CurrentAccount.GetProfileUrl()));
            OpenAccountURLCommand = new RelayCommand((o) => CurrentAccount.OpenInBrowser());
            OpenOtherURLCommand   = new RelayCommand((o) => CurrentAccount.OpenInBrowser($"/{o}"));
            CopySteamIDCommand    = new AsyncRelayCommand(OnCopyingSteamID);
        }
    }
}
