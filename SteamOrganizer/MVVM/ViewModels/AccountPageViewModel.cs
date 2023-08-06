using Microsoft.Win32;
using Newtonsoft.Json;
using SteamOrganizer.Helpers;
using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.View.Extensions;
using System;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountPageViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand LoadAuthenticatorCommand { get; }
        public RelayCommand CopyAccountURLCommand { get; }
        public RelayCommand OpenAccountURLCommand { get; }
        public RelayCommand OpenOtherURLCommand { get; }
        public RelayCommand BackCommand { get; }
        public AsyncRelayCommand UpdateCommand { get; }
        public AsyncRelayCommand CopySteamIDCommand { get; }
        public AsyncRelayCommand CopyAuthCodeCommand { get; }
        #endregion


        #region Properties

        private bool IsSteamCodeGenerating = false;
        private readonly AccountPageView View;

        public BitmapImage FullAvatar { get; private set; }
        public int SelectedTabIndex { get; set; }
        public bool IsPasswordShown { get; set; }

        private bool _isSteamCredentialsExpanded = false;
        public bool IsSteamCredentialsExpanded
        {
            get => _isSteamCredentialsExpanded;
            set
            {
                if (value.Equals(_isSteamCredentialsExpanded))
                    return;

                _isSteamCredentialsExpanded = value;
                _passwordTemp = EncryptionTools.XorString(_passwordTemp);
                OnPropertyChanged(nameof(Password));
            }
        }

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

        private string _appsPriceFormat;
        public string AppsPriceFormat
        {
            get => _appsPriceFormat;
            set => SetProperty(ref _appsPriceFormat, value);
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

        private bool WaitingForSave = false;
        private string _passwordTemp;
        public string Password
        {
            get => _passwordTemp;
            set
            {
                _passwordTemp = value;
                if (string.IsNullOrEmpty(_passwordTemp))
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

                    if (WaitingForSave)
                    {
                        return;
                    }

                    Utils.InBackground(async () =>
                    {
                        WaitingForSave = true;
                        await Task.Delay(2000);
                        CurrentAccount.Password = IsSteamCredentialsExpanded ? EncryptionTools.XorString(_passwordTemp) : _passwordTemp;
                        App.Config.SaveDatabase(3000);
                        WaitingForSave = false;
                    });
                }
            }
        }

        public string AuthenticatorCode { get; set; } = ".....";
        public Account CurrentAccount { get; }
        #endregion


        #region Initialize

        private void InitBansInfo()
        {
            if (CurrentAccount.EconomyBan != 0)
            {
                EconomyBanDetails = (CurrentAccount.EconomyBan == 1 ? "The account is temporarily blocked." :
                    "The account is permanently banned.") + " Trade/exchange/sending of gifts is prohibited on this account";
            }

            if (CurrentAccount.DaysSinceLastBan == 0)
                return;
            
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
        }

        private void InitYearsOfService()
        {
            if (CurrentAccount.YearsOfService >= 1f)
            {
                YearImagePath = $"/Resources/Images/SteamYearsBadges/year{(int)CurrentAccount.YearsOfService}.bmp";
                return;
            }
            YearImagePath = "/Resources/Images/Transparent.bmp";
        }

        private void InitGamesInfo()
        {
            if (CurrentAccount.GamesCount <= 0)
            {
                GamesImagePath = "/Resources/Images/Transparent.bmp";
                return;
            }

            if(CurrentAccount.PaidGames != 0 && CurrencyHelper.TryGetCurrencySymbol(CurrentAccount.GamesCurrency.ToString(),out string symbol))
            {
                AppsPriceFormat = $"{CurrentAccount.TotalGamesPrice.ToString("N0",CultureInfo.InvariantCulture)} {symbol} ({CurrentAccount.GamesCurrency})";
            }

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
            InitAvatar();

            if (CurrentAccount.SteamID64 == null)
            {
                AdditionalControlsVis = Visibility.Collapsed;
                return;
            }

            InitYearsOfService();
            InitGamesInfo();
            InitBansInfo();
        }
        #endregion

        internal void StopBackgroundWorkers()
        {
            if (IsSteamCodeGenerating)
            {
                IsSteamCodeGenerating = false;
            }
        }
        

        private async Task OnCopying(object data,object target)
        {
            Clipboard.SetDataObject(data);
            await Utils.OpenAutoClosableToolTip(target as FrameworkElement, App.FindString("copied_info"));
        }

        private async Task OnAccountUpdating(object param)
        {
            if (!await CurrentAccount.RetrieveInfo(true))
            {
                PushNotification.Open("An error occurred while trying to update account", type: PushNotification.EPushNotificationType.Error);
                return;
            }

            Init();
            OnPropertyChanged(nameof(CurrentAccount));
            (App.MainWindowVM.Accounts.DataContext as AccountsViewModel).RefreshCollection();
            App.Config.SaveDatabase();
            View.UpdateButton.Visibility = Visibility.Collapsed;

            if (App.TrayMenu.UpdateTrayAccounts(new Account[1] { CurrentAccount }))
            {
                App.Config.Save();
            }
        }

        private void OnLoadingAuthenticator(object param)
        {
            if(CurrentAccount.Authenticator != null)
            {
                QueryPopup.GetPopup(App.FindString("apv_auth_remove"), () =>
                {
                    IsSteamCodeGenerating        = false;
                    CurrentAccount.Authenticator = null;
                    App.Config.SaveDatabase();
                }).OpenPopup(param as FrameworkElement, System.Windows.Controls.Primitives.PlacementMode.Bottom);
                return;
            }

            var fileDialog = new OpenFileDialog
            {
                Filter = "Mobile authenticator File (.maFile)|*.maFile",
            };

            if (fileDialog.ShowDialog() != true)
                return;

            try
            {
                var auth = JsonConvert.DeserializeObject<SteamAuth>(File.ReadAllText(fileDialog.FileName));

                if(auth.Account_name != CurrentAccount.Login.ToLower() || App.Config.Database.Exists(o => o.Authenticator?.Shared_secret.Equals(auth.Shared_secret) == true))
                {
                    PushNotification.Open("Failed to load authenticator. You are trying to add an authenticator from another account, please check your steam credentials", type: PushNotification.EPushNotificationType.Error);
                    return;
                }

                auth.Secret                  = auth.Uri.Split('=')[1].Split('&')[0];
                CurrentAccount.Authenticator = StringEncryption.EncryptAllStrings(auth);
                App.Config.SaveDatabase();
                GenerateSteamGuardTokens();
            }
            catch 
            {
                PushNotification.Open("Failed to load authenticator. Invalid format",type: PushNotification.EPushNotificationType.Error);
                return;
            }
            
        }

        private async void GenerateSteamGuardTokens()
        {
            if (IsSteamCodeGenerating)
                return;

            IsSteamCodeGenerating = true;
            for (View.TokensGenProgress.Value = 0d; IsSteamCodeGenerating; View.TokensGenProgress.Value--)
            {
                if (View.TokensGenProgress.Value == 0d)
                {
                    View.TokensGenProgress.Value = 30d;
                    AuthenticatorCode = await CurrentAccount.Authenticator.GenerateCode();
                    OnPropertyChanged(nameof(AuthenticatorCode));
                }

                await Task.Delay(1000);
            }
        }


        public AccountPageViewModel(AccountPageView owner,Account account)
        {
            BackCommand              = new RelayCommand((o) => App.MainWindowVM.AccountsCommand.Execute(null));
            CopyAccountURLCommand    = new RelayCommand((o) => Clipboard.SetDataObject(CurrentAccount.GetProfileUrl()));
            LoadAuthenticatorCommand = new RelayCommand(OnLoadingAuthenticator);
            OpenAccountURLCommand    = new RelayCommand((o) => CurrentAccount.OpenInBrowser());
            OpenOtherURLCommand      = new RelayCommand((o) => CurrentAccount.OpenInBrowser($"/{o}"));
            CopySteamIDCommand       = new AsyncRelayCommand(async(o) => await OnCopying(SteamIDField,o));
            UpdateCommand            = new AsyncRelayCommand(OnAccountUpdating);
            CopyAuthCodeCommand      = new AsyncRelayCommand(async (o) => await OnCopying(AuthenticatorCode, o));

            View                = owner;
            this.CurrentAccount = account;
            _passwordTemp       = CurrentAccount.Password;
            Init();

            if(CurrentAccount.Authenticator != null)
            {
                GenerateSteamGuardTokens();
            }
        }
    }
}
