using Microsoft.Win32;
using Newtonsoft.Json;
using SteamOrganizer.Helpers;
using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Steam;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.View.Extensions;
using System;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountPageViewModel : ObservableObject
    {
        public AccountPageViewModel(AccountPageView owner, Account account)
        {
            BackCommand                     = new RelayCommand(App.MainWindowVM.AccountsCommand.Execute);
            CopyAccountURLCommand           = new RelayCommand(o => Clipboard.SetDataObject(CurrentAccount.GetProfileUrl()));
            LoadAuthenticatorCommand        = new RelayCommand(OnLoadingAuthenticator);
            OpenAccountURLCommand           = new RelayCommand(o => CurrentAccount.OpenInBrowser());
            OpenOtherURLCommand             = new RelayCommand(o => CurrentAccount.OpenInBrowser($"/{o}"));
            CopySteamIDCommand              = new AsyncRelayCommand(async o => await OnCopying(SteamIDField, o));
            UpdateCommand                   = new AsyncRelayCommand(OnAccountUpdating);
            CopyAuthCodeCommand             = new AsyncRelayCommand(async o => await OnCopying(AuthenticatorCode, o));
            OpenFriendPageCommand           = new AsyncRelayCommand(OnOpeningFriendPage);
            CreateShortcutCommand           = new AsyncRelayCommand(OnCreatingShortcut);
            InstallGameCommand              = new RelayCommand(OnGameInstallation);
            ClearSearchBarCommand           = new RelayCommand(o => SearchBarText = null);
            SelectExternalCredentialCommand = new RelayCommand(OnExternalCredentialSelection);
            ClearSearchBarCommand           = new RelayCommand(o => SearchBarText = null);
            OpenInSteamDb                   = new RelayCommand(o => System.Diagnostics.Process.Start("https://steamdb.info/app/" + (o as API.Game).AppID).Dispose());


            View = owner;
            this.CurrentAccount = account;
            _passwordTemp = CurrentAccount.Password;
            Init();

            if (account.Login == null)
            {
                InteractionControlsVis = Visibility.Collapsed;
                return;
            }

            if (CurrentAccount.Authenticator != null)
            {
                GenerateSteamGuardTokens();
            }
        }

        internal void Dispose()
        {
            if (IsSteamCodeGenerating)
            {
                IsSteamCodeGenerating = false;
            }

            EncryptionTools.ClearString(AuthenticatorCode, _externalEmail, _externalPassword, _passwordTemp);

            FullAvatar = null;
        }

        #region Commands
        public RelayCommand LoadAuthenticatorCommand { get; }
        public RelayCommand CopyAccountURLCommand { get; }
        public RelayCommand OpenAccountURLCommand { get; }
        public RelayCommand OpenOtherURLCommand { get; }
        public RelayCommand BackCommand { get; }
        public RelayCommand SelectExternalCredentialCommand { get; }
        public AsyncRelayCommand UpdateCommand { get; }
        public AsyncRelayCommand CopySteamIDCommand { get; }
        public AsyncRelayCommand CopyAuthCodeCommand { get; }
        public AsyncRelayCommand OpenFriendPageCommand { get; }
        public AsyncRelayCommand CreateShortcutCommand { get; }

        public RelayCommand InstallGameCommand { get; }
        public RelayCommand ClearSearchBarCommand { get; }
        public RelayCommand OpenInSteamDb { get; }

        #endregion

        #region Properties

        #region Flags
        private bool IsSteamCodeGenerating = false;
        public Visibility AdditionalControlsVis { get; private set; } = Visibility.Visible;
        public Visibility OnlineControlsVis { get; private set; } = Visibility.Collapsed;
        public Visibility InteractionControlsVis { get; private set; } = Visibility.Visible;
        public bool IsPasswordShown { get; set; }

        private int _selectedTabIndex = 0;
        public int SelectedTabIndex
        {
            get => _selectedTabIndex;
            set
            {
                _selectedTabIndex = value;

                if (value == 1)
                {
                    Utils.InBackground(LoadGames);
                }
                else if(value == 2)
                {
                    Utils.InBackground(LoadFriends);
                }
                else if(_loadingState != 0)
                {
                    LoadingState = 0;
                }

                if (value == 1 || value == 2)
                {
                    OnPropertyChanged(nameof(SearchBarText));
                }
            }
        }

        private byte _loadingState = 0;
        public byte LoadingState
        {
            get => _loadingState;
            set => SetProperty(ref _loadingState, value);
        }

        #endregion

        #region Steam summaries
        private readonly AccountPageView View;
        public Account CurrentAccount { get; }

        public BitmapImage FullAvatar { get; private set; }
        public string AuthenticatorCode { get; set; } = ".....";


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
            private set => SetProperty(ref _steamCredentialsErr, value);
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
                    if (_steamCredentialsErr != null)
                        SteamCrenetialsErr = null;
                    
                    CurrentAccount.Password = EncryptionTools.XorString(value);
                    App.Config.SaveDatabase(3000);
                }
            }
        }

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
        #endregion

        #region External credentials stuff

        private static readonly (PropertyInfo Email, PropertyInfo Password)[] ExternalCredentialsProperties = new (PropertyInfo Email, PropertyInfo Password)[4]
        {
                    (typeof(Account).GetProperty(nameof(Account.SteamEmail)),typeof(Account).GetProperty(nameof(Account.SteamEmailPassword))),
                    (typeof(Account).GetProperty(nameof(Account.UbisoftEmail)),typeof(Account).GetProperty(nameof(Account.UbisoftPassword))),
                    (typeof(Account).GetProperty(nameof(Account.RockstarEmail)),typeof(Account).GetProperty(nameof(Account.RockstarPassword))),
                    (typeof(Account).GetProperty(nameof(Account.EpicGamesEmail)),typeof(Account).GetProperty(nameof(Account.EpicGamesPassword))),
        };

        private (PropertyInfo Email, PropertyInfo Password) SelectedExternalCredentialsProp;
        public bool[] ExternalCredentialsChecked { get; } = new bool[4] { true, false, false, false };

        private bool _isExternalCredentialsExpanded = false;
        public bool IsExternalCredentialsExpanded
        {
            get => _isExternalCredentialsExpanded;
            set
            {
                if (value.Equals(_isExternalCredentialsExpanded))
                    return;

                _isExternalCredentialsExpanded = value;
                OnExternalCredentialSelection(null);
            }
        }

        private string _externalEmail;

        public string ExternalEmail
        {
            get => _externalEmail;
            set
            {
                if (value.Length == 0)
                    value = null;

                EncryptionTools.ClearString(_externalEmail);
                _externalEmail = value;

                SelectedExternalCredentialsProp.Email.SetValue(CurrentAccount,EncryptionTools.XorString(value));
                App.Config.SaveDatabase(1000);
                EncryptionTools.ClearString(value);
            }
        }

        private string _externalPassword;
        public string ExternalPassword
        {
            get => _externalPassword;
            set
            {
                if (value.Length == 0)
                    value = null;

                EncryptionTools.ClearString(_externalPassword);
                _externalPassword = value;

                SelectedExternalCredentialsProp.Password.SetValue(CurrentAccount,EncryptionTools.XorString(value));
                App.Config.SaveDatabase(1000);
                EncryptionTools.ClearString(value);
            }
        }

        #endregion

        #region Games and friends + searching
        public API.Game[] Games { get; private set; }
        public API.Friend[] Friends { get; private set; }

        private string _friendsSearchBarText;
        private string _gamesSearchBarText;
        public string SearchBarText
        {
            get => _selectedTabIndex == 1 ? _gamesSearchBarText : _friendsSearchBarText;
            set
            {
                object collection = _selectedTabIndex == 1 ? (object)Games : Friends;

                if (collection == null)
                    return;

                var view          = CollectionViewSource.GetDefaultView(collection);

                if (_selectedTabIndex == 1)
                {
                    _gamesSearchBarText = value;
                }
                else
                {
                    _friendsSearchBarText = value;
                }

                if (value == null)
                {
                    OnPropertyChanged();
                    view.Filter = null;
                }
                else if (view.Filter == null)
                {
                    view.Filter = OnContentSearching;
                }

                view.Refresh();

                if (view.IsEmpty)
                {
                    LoadingState = 1;
                    return;
                }
                LoadingState = 0;
            }
        } 
        #endregion

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

        #region Background workers
        private async void GenerateSteamGuardTokens()
        {
            if (IsSteamCodeGenerating)
                return;

            IsSteamCodeGenerating = true;
            if (View.TwoFaCodeBorder.Visibility != Visibility.Visible)
            {
                View.TwoFaCodeBorder.Visibility = Visibility.Visible;
            }

            await GenerateCode();

            for (View.TokensGenProgress.Value = 30 - ((await SteamAuth.GetSteamTime()) % 30); IsSteamCodeGenerating; View.TokensGenProgress.Value--)
            {
                if (View.TokensGenProgress.Value == 0d)
                {
                    View.TokensGenProgress.Value = 30d;
                    await GenerateCode();
                }

                await Task.Delay(1000);
            }

            async Task GenerateCode()
            {
                AuthenticatorCode = await CurrentAccount.Authenticator.GenerateCode();
                if (AuthenticatorCode == null)
                {
                    View.TwoFaCodeBorder.Visibility = Visibility.Collapsed;
                    IsSteamCodeGenerating = false;
                }

                OnPropertyChanged(nameof(AuthenticatorCode));
            }
        } 
        #endregion

        #region Games, friends + searching
        private bool OnContentSearching(object sender)
        {
            if (sender is API.Game game)
                return game.Name.IndexOf(_gamesSearchBarText, StringComparison.InvariantCultureIgnoreCase) >= 0;

            if (sender is API.Friend friend)
                return friend.PersonaName.IndexOf(_friendsSearchBarText, StringComparison.InvariantCultureIgnoreCase) >= 0;

            return true;
        }

        private async void LoadGames()
        {
            if (Games != null)
                return;

            var path = Path.Combine(CachingManager.GamesCachePath, CurrentAccount.SteamID64.ToString());

            LoadingState = 2;

            var fromCache = File.Exists(path);
            var prevGames = CurrentAccount.PaidGames;
            if (fromCache || (!fromCache && CurrentAccount.GamesCount > 0 && await API.GetGames(CurrentAccount)))
            {
                FileCryptor.Deserialize(path, out API.Game[] games);
                Games = games;
            }

            if (Games == null || Games.Length == 0)
            {
                LoadingState = 1;
                return;
            }

            if (CurrentAccount.PaidGames != 0 && CurrentAccount.PaidGames != prevGames)
            {
                InitGamesInfo();
                CurrentAccount.InvokePropertyChanged(nameof(CurrentAccount.PaidGames));
            }


            OnPropertyChanged(nameof(Games));
            LoadingState = 0;
        }

        private async void LoadFriends()
        {
            if (Friends != null)
                return;

            var path = Path.Combine(CachingManager.FriendsCachePath, CurrentAccount.SteamID64.ToString());
            LoadingState = 2;

            if (File.Exists(path) || (CurrentAccount.VisibilityState == 3 && await API.GetFriends(CurrentAccount)))
            {
                FileCryptor.Deserialize(path, out API.Friend[] friends);
                Friends = friends;
            }

            if (Friends == null || Friends.Length == 0)
            {
                LoadingState = 1;
                return;
            }

            OnPropertyChanged(nameof(Friends));
            LoadingState = 0;
        }
        #endregion

        #region Command actions
        private async Task OnCreatingShortcut(object param)
        {
            var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), $"{CurrentAccount.Nickname}.lnk");
            if (File.Exists(path))
            {
                PushNotification.Open("A shortcut has already been created for this account",type: PushNotification.EPushNotificationType.Warn);
                await Task.Delay(3000);
                return;
            }

            var iconPath = $"{CachingManager.AvatarsCachePath}\\{CurrentAccount.AvatarHash}_medium";

            if(!File.Exists(iconPath))
            {
                CachingManager.CacheAvatar(CachingManager.GetCachedAvatar(null),iconPath);
            }

            Win32.CreateShortcut(path, Assembly.GetExecutingAssembly().Location, $"-login {CurrentAccount.Login}", App.WorkingDir, null, "", iconPath);
            PushNotification.Open("Shortcut created, click to open",
                () => System.Diagnostics.Process.Start("explorer.exe", "/select, \"" + path + "\"").Dispose());
        }

        private async Task OnCopying(object data, object target)
        {
            Clipboard.SetDataObject(data);
            await Utils.OpenAutoClosableToolTip(target as FrameworkElement, App.FindString("copied_info"));
        }

        private async Task OnAccountUpdating(object param)
        {
            if (!WebBrowser.IsNetworkAvailable)
            {
                App.WebBrowser.OpenNeedConnectionPopup();
                return;
            }

            if (!await CurrentAccount.RetrieveInfo())
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
            if (CurrentAccount.Authenticator != null)
            {
                QueryPopup.GetPopup(App.FindString("apv_auth_remove"), () =>
                {
                    IsSteamCodeGenerating = false;
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

                if (string.IsNullOrEmpty(auth.Account_name) || auth.Account_name != CurrentAccount.Login.ToLower() || App.Config.Database.Exists(o => o.Authenticator?.Shared_secret.Equals(auth.Shared_secret) == true))
                {
                    PushNotification.Open("Failed to load authenticator. You are trying to add an authenticator from another account, please check your steam credentials", type: PushNotification.EPushNotificationType.Error);
                    return;
                }

                auth.Secret = auth.Uri?.Split('=')[1].Split('&')[0];
                CurrentAccount.Authenticator = StringEncryption.EncryptAllStrings(App.Config.DatabaseKey, auth);
                App.Config.SaveDatabase();
                GenerateSteamGuardTokens();
            }
            catch
            {
                PushNotification.Open("Failed to load authenticator. Invalid format", type: PushNotification.EPushNotificationType.Error);
                return;
            }

        }

        private void OnExternalCredentialSelection(object param)
        {
            EncryptionTools.ClearString(_externalPassword, _externalEmail);

            if (!_isExternalCredentialsExpanded)
                return;

            SelectedExternalCredentialsProp = ExternalCredentialsProperties[Array.IndexOf(ExternalCredentialsChecked, true)];

            _externalPassword = EncryptionTools.XorString(App.Config.DatabaseKey,
                SelectedExternalCredentialsProp.Password.GetValue(CurrentAccount) as string);

            _externalEmail = EncryptionTools.XorString(App.Config.DatabaseKey,
                SelectedExternalCredentialsProp.Email.GetValue(CurrentAccount) as string);

            OnPropertyChanged(nameof(ExternalPassword));
            OnPropertyChanged(nameof(ExternalEmail));
        }

        private void OnGameInstallation(object param)
        {
            if (SteamRegistry.GetActiveUserSteamID() != CurrentAccount.SteamID64)
            {
                PushNotification.Open("Log into this account on your computer to install the app");
                return;
            }

            System.Diagnostics.Process.Start($"steam://install/{(param as API.Game).AppID}");
        }

        private async Task OnOpeningFriendPage(object param)
        {
            if (!WebBrowser.IsNetworkAvailable)
            {
                App.WebBrowser.OpenNeedConnectionPopup();
                await Task.Delay(3000);
                return;
            }

            var id = (param as API.Friend).SteamID;

            if (App.Config.Database.Exists(o => o.SteamID64 == id, out Account acc)) { }
            else if (await API.GetInfo(acc = new Account(null, null, id)) != API.EAPIResult.OK)
            {
                PushNotification.Open("Failed to open page, please try again later");
                return;
            }

            App.MainWindowVM.AccountPage.OpenPage(acc);
            Dispose();
        }
        #endregion

    }
}
