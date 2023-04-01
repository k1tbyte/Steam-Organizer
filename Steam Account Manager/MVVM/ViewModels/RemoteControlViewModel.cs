using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Converters;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.Windows;
using Steam_Account_Manager.Utils;
using SteamKit2;
using SteamKit2.Internal;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Steam_Account_Manager.MVVM.ViewModels
{
    internal class RemoteControlViewModel : ObservableObject
    {
        public static SemaphoreSlim LoginSemaphore { get; private set; }

        #region Commands
        public AsyncRelayCommand LogOnCommand { get; private set; }
        public RelayCommand LogOutCommand { get; private set; }
        public RelayCommand ChangeNicknameCommand { get; private set; }
        public RelayCommand RemoveRecentUserCommand { get; private set; }
        public RelayCommand OpenStoreAppLinkCommand { get; private set; }
        public RelayCommand OpenUrlProfileCommand { get; private set; }
        public RelayCommand UpdateGamesListCommand { get; private set; }
        public AsyncRelayCommand OpenGameAchievementsCommand { get; private set; }
        public AsyncRelayCommand UpdateFriendsListCommand { get; private set; }
        public RelayCommand SelectChatCommand { get; private set; }
        public RelayCommand LeaveChatCommand { get; private set; }
        public RelayCommand AddChatAdminCommand { get; private set; }
        public RelayCommand OpenFriendChatCommand { get; private set; }
        public RelayCommand RemoveFriendCommand { get; private set; }
        public AsyncRelayCommand SendSteamGuardCodeCommand { get; private set; }
        public AsyncRelayCommand ApplyPrivacyCommand { get; private set; }
        public AsyncRelayCommand RefreshTradeToken { get; private set; }
        #endregion

        #region Properties
        private string _username, _password,_authCode, _errorMsg;
        private bool _needGamesUpdate,_needFriendsUpdate;
        public User CurrentUser => SteamRemoteClient.CurrentUser;
        public ConfigProperties Properties => Config.Properties;
        public bool IsWebLoggedIn => SteamRemoteClient.IsWebLoggedIn;

        public string AuthCode
        {
            get => _authCode;
            set => SetProperty(ref _authCode, value);
        }
        private bool _isLoggedOn;
        public bool IsLoggedOn
        {
            get => _isLoggedOn;
            set => SetProperty(ref _isLoggedOn, value);
        }

        private int _confirmationType = 0;
        public int ConfirmationType
        {
            get => _confirmationType;
            set => SetProperty(ref _confirmationType, value);
        }

        #region Games properties
        private bool _isGamesIdling;
        public bool IsGamesIdling
        {
            get => _isGamesIdling;
            set
            {
                if(IsPlayingSessionBlocked == true)
                {
                    Presentation.OpenPopupMessageBox("Steam is currently being used on another computer, please end your game session to start");
                    return;
                }
                if (value)
                {
                    if (SelectedGamesCount <= 0 && String.IsNullOrWhiteSpace(CurrentUser.CustomGameTitle)) return;

                    var selected = Games?.Where(game => game.IsSelected);
                    _ = SteamRemoteClient.IdleGames(selected?.Select(game => game.AppID).ToHashSet(), CurrentUser.CustomGameTitle);
                }
                else
                {
                    _ = SteamRemoteClient.StopIdle();
                }

                SetProperty(ref _isGamesIdling, value);
            }
        }

        private bool? _isPlayingSessionBlocked;
        public bool? IsPlayingSessionBlocked
        {
            get => _isPlayingSessionBlocked;
            set => SetProperty(ref _isPlayingSessionBlocked, value);
        }

        private ObservableCollection<PlayerGame> _games;
        public ObservableCollection<PlayerGame> Games
        {
            get => _games;
            set
            {
                SetProperty(ref _games, value);
                _needGamesUpdate = true;
            }
        }

        private int _selectedGamesCount;
        public int SelectedGamesCount
        {
            get => _selectedGamesCount;
            set
            {
                SetProperty(ref _selectedGamesCount, value);
                _needGamesUpdate = true;
            }
        } 
        #endregion

        private static ObservableCollection<RecentlyLoggedAccount> _recentlyLoggedIn;
        public static event EventHandler RecentlyLoggedOnChanged;
        public static ObservableCollection<RecentlyLoggedAccount> RecentlyLoggedIn
        {
            get => _recentlyLoggedIn;
            set
            {
                _recentlyLoggedIn = value;
                RecentlyLoggedOnChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private ObservableCollection<SteamChatMessage> _messages = new ObservableCollection<SteamChatMessage>();
        public ObservableCollection<SteamChatMessage> Messages
        {
            get => _messages;
            set => SetProperty(ref _messages, value);
            
        }

        private ObservableCollection<Friend> _friends;
        public ObservableCollection<Friend> Friends
        {
            get => _friends;
            set
            {
                SetProperty(ref _friends, value);
                _needFriendsUpdate = true;
            }
        }

        private int _selectedTabIndex;
        public int SelectedTabIndex
        {
            get => _selectedTabIndex;
            set
            {
                if (value == 1 && Games == null)
                    Games = SteamRemoteClient.GetOwnedGames().Result;
                else if (value == 3 && Friends == null)
                    Friends = SteamRemoteClient.ParseUserFriends().Result;

                SetProperty(ref _selectedTabIndex, value);
            }
        }

        public string Password
        {
            get => _password;
            set => SetProperty(ref _password, value);
        }
        public string Username
        {
            get => _username;
            set => SetProperty(ref _username, value);
        }

        public string ErrorMsg
        {
            get => _errorMsg;
            set => SetProperty(ref _errorMsg, value);
        }
        #endregion

        #region Helpers
        private void CheckLoginResult(EResult result)
        {
            ErrorMsg = "";
            switch (result)
            {
                case EResult.InvalidPassword:
                    ErrorMsg = App.FindString("rc_lv_invalidPass");
                    Password = "";
                    break;
                case EResult.NoConnection:
                    ErrorMsg = App.FindString("rc_lv_noInternet");
                    break;
                case EResult.ServiceUnavailable:
                    ErrorMsg = App.FindString("rc_lv_servUnavailable");
                    break;
                case EResult.AccessDenied:
                    ErrorMsg = "Connection lost. Access denied.";
                    break;
                case EResult.Timeout:
                    ErrorMsg = App.FindString("rc_lv_workTimeout");
                    break;
                case EResult.RateLimitExceeded:
                    ErrorMsg = App.FindString("rc_lv_retriesExceeded");
                    break;
                case EResult.TryAnotherCM:
                    ErrorMsg = App.FindString("rc_lv_tryLater");
                    break;
                case EResult.TwoFactorCodeMismatch:
                    AuthCode = "";
                    ErrorMsg = "Two-factor authentication code mismatch";
                    break;
                case EResult.AccountLogonDenied:
                    break;
            }
        }

        private void HandlePlayingSession(bool isSessionBlocked)
        {
            if(IsPlayingSessionBlocked.HasValue && IsPlayingSessionBlocked == isSessionBlocked) return;

            IsPlayingSessionBlocked = isSessionBlocked;

            if (!isSessionBlocked && !IsGamesIdling && SelectedGamesCount > 0 && CurrentUser.AutoIdlingGames)
                IsGamesIdling = true;
        }

        private void HandleDisconnection(EResult logOutResult)
        {
            if (IsLoggedOn && CurrentUser != null && CurrentUser.SteamID64 != 0)
            {
                if(logOutResult == EResult.LoggedInElsewhere && IsGamesIdling && CurrentUser.AutoIdlingGames && RecentlyLoggedIn.Exists(o => o.Username == CurrentUser.Username,out int index))
                {
                    ResetPlayingState(false);
                    LogOnCommand.Execute(RecentlyLoggedIn[index]);
                    return;
                }

                Common.BinarySerialize(CurrentUser, $"{App.WorkingDirectory}\\RemoteUsers\\{Username}\\User.dat");

                if(Games != null && Games.Count > 0 && _needGamesUpdate)
                     Common.BinarySerialize(Games.ToArray(), $"{App.WorkingDirectory}\\Cache\\Games\\{CurrentUser.SteamID64}.dat");

                if (Friends != null && Friends.Count > 0 && _needFriendsUpdate)
                    Common.BinarySerialize(Friends.ToArray(), $"{App.WorkingDirectory}\\Cache\\Friends\\{CurrentUser.SteamID64}.dat");

                //Updating local accdb cache
                var localUser = Config.Accounts.Find(o => o.SteamId64 == CurrentUser.SteamID64);
                if (localUser != null && (localUser.Nickname != CurrentUser.Nickname || localUser.AvatarHash != CurrentUser.AvatarHash || CurrentUser.Level != localUser.SteamLevel))
                {
                    if(!String.IsNullOrEmpty(localUser.Nickname))
                        localUser.Nickname   = CurrentUser.Nickname;
                    
                    if(!String.IsNullOrEmpty(localUser.AvatarHash))
                        localUser.AvatarHash = CurrentUser.AvatarHash;

                    if(CurrentUser.Level != null)
                        localUser.SteamLevel = (int?)CurrentUser.Level;

                    Config.SaveAccounts();
                }
            }

            if (App.IsShuttingDown)
            {
                LoginSemaphore.Release();
                App.Shutdown();
                return;
            }

            Games                              = null;
            SteamRemoteClient.CurrentUser      = null;
            App.Current.Dispatcher.Invoke(()   => Messages.Clear());
            _isGamesIdling                     = IsLoggedOn = false;
            ConfirmationType                   = SelectedGamesCount = 0;
        }
        private void HandleConnection()
        {
            if (IsLoggedOn) return;

            string gamesCache = $"{App.WorkingDirectory}\\Cache\\Games\\{CurrentUser.SteamID64}.dat";
            string friendsCache = $"{App.WorkingDirectory}\\Cache\\Friends\\{CurrentUser.SteamID64}.dat";

            if (System.IO.File.Exists(gamesCache))
            {
                Games              = new ObservableCollection<PlayerGame>(Common.BinaryDeserialize<PlayerGame[]>(gamesCache));
                SelectedGamesCount = Games.Where(o => o.IsSelected).Count();
                _needGamesUpdate  = false;
            }

            if(System.IO.File.Exists(friendsCache))
            {
                Friends            = new ObservableCollection<Friend>(Common.BinaryDeserialize<Friend[]>(friendsCache));
                _needFriendsUpdate = false;
            }

            IsLoggedOn = true;
        } 
        private bool CheckSteamID(string steamid, out ulong id64)
        {
            id64 = SteamIDConverter.ToSteamID64(steamid).Result;
            if (id64 == 0)
            {
                Utils.Presentation.OpenPopupMessageBox("The user with this ID was not found. Check for correctness.,", true);
                return false;
            }
            else if (id64 == CurrentUser.SteamID64) return false;
            return true;
        }
        public void ResetPlayingState(bool value)
        {
            _isGamesIdling = value;
            OnPropertyChanged(nameof(IsGamesIdling));
        }
        #endregion

        public RemoteControlViewModel()
        {
            RecentlyLoggedIn = Config.Deserialize(App.WorkingDirectory + "\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey) as ObservableCollection<RecentlyLoggedAccount> ?? new ObservableCollection<RecentlyLoggedAccount>();
            // IsLoggedOn = true;

            SteamRemoteClient.UserStatusChanged += () => { OnPropertyChanged(nameof(CurrentUser)); OnPropertyChanged(nameof(IsWebLoggedIn));  }; 
            SteamRemoteClient.Connected += HandleConnection;
            SteamRemoteClient.Disconnected += HandleDisconnection;
            SteamRemoteClient.GameSessionStateCallback += HandlePlayingSession;
            SteamRemoteClient.AuthenticationCallback += (type) => ConfirmationType = type == EAuthSessionGuardType.k_EAuthSessionGuardType_None ? 0 : (int)type;
            SteamRemoteClient.SteamChatCallback += (msg) => App.Current.Dispatcher.Invoke(() => Messages.Add(msg));
            LoginSemaphore = new SemaphoreSlim(1);

            LogOnCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!await LoginSemaphore.WaitAsync(10000))
                    return;

                if (!Common.CheckInternetConnection())
                {
                    ErrorMsg = App.FindString("rc_lv_noInternet");
                    return;
                }

                ErrorMsg = "";

                if (o is Account acc)
                {
                    Username = acc.Login;
                    Password = acc.Password;
                }
                else if (o is RecentlyLoggedAccount recently)
                    Username = recently.Username;

                if (!String.IsNullOrWhiteSpace(Username) && (!String.IsNullOrEmpty(Password) || o?.GetType() == typeof(RecentlyLoggedAccount)))
                    CheckLoginResult(await Task.Run(() => SteamRemoteClient.Login(Username, Password)));

                LoginSemaphore.Release();
            });

            #region Account common 
            RemoveRecentUserCommand = new RelayCommand(o =>
            {
                RecentlyLoggedIn.Remove(o as RecentlyLoggedAccount);
                Config.Serialize(RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
            });
            LogOutCommand = new RelayCommand(o =>
            {
                SteamRemoteClient.Logout();
                Username = Password = AuthCode = "";
            });
            SendSteamGuardCodeCommand = new AsyncRelayCommand(async (o) =>
            {
                ErrorMsg = "";
                if (ConfirmationType == 4)
                {
                    ConfirmationType = 3;
                    return;
                }
                else if(!String.IsNullOrWhiteSpace(AuthCode) && AuthCode.Length == 5)
                {
                    try
                    {
                        await SteamRemoteClient.AuthSession.SendSteamGuardCodeAsync(AuthCode, (EAuthSessionGuardType)ConfirmationType);
                    }
                    catch(SteamKit2.Authentication.AuthenticationException e)
                    {
                        CheckLoginResult(e.Result);
                    }
                }
            });

            ChangeNicknameCommand = new RelayCommand(o =>
            {
                if (o is System.Windows.Controls.TextBox txtBox && !String.IsNullOrEmpty(txtBox.Text) && txtBox.Text != CurrentUser.Nickname)
                {
                    SteamRemoteClient.ChangeCurrentName(txtBox.Text);
                }
            });

            #endregion

            #region Games
            OpenStoreAppLinkCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo($"https://store.steampowered.com/app/{o}")).Dispose());
            UpdateGamesListCommand = new RelayCommand(o => Games = SteamRemoteClient.GetOwnedGames().Result);
            OpenGameAchievementsCommand = new AsyncRelayCommand(async (o) =>
            {
                var collection = await SteamRemoteClient.GetAppAchievements(Convert.ToUInt64(o));
                if (collection == null || collection.Count == 0)
                {
                    Utils.Presentation.OpenPopupMessageBox($"It seems there are no achievements available in the selected game...");
                    return;
                }

                Utils.Presentation.OpenDialogWindow(new AchievementsWindow((int)o, ref collection));
            }); 
            #endregion

            #region Chat
            SelectChatCommand = new RelayCommand(o =>
            {
                if (!CheckSteamID(o as string, out ulong id64) || id64 == CurrentUser.InterlocutorID) return;
                CurrentUser.InterlocutorID = id64;
                OnPropertyChanged(nameof(CurrentUser));
            });
            LeaveChatCommand = new RelayCommand(o =>
            {
                Messages.Clear();
                CurrentUser.InterlocutorID = 0;
                OnPropertyChanged(nameof(CurrentUser));
            });
            AddChatAdminCommand = new RelayCommand(o =>
            {
                if (string.IsNullOrEmpty(o as string)) CurrentUser.AdminID = null;
                else if (!CheckSteamID(o as string, out ulong id64) || id64 == CurrentUser.AdminID) return;
                else CurrentUser.AdminID = id64;
                OnPropertyChanged(nameof(CurrentUser));
            });
            #endregion

            #region Friends
            UpdateFriendsListCommand = new AsyncRelayCommand(async (o) => Friends = await SteamRemoteClient.ParseUserFriends());
            OpenFriendChatCommand = new RelayCommand(o =>
            {
                Messages.Clear();
                CurrentUser.InterlocutorID = Convert.ToUInt64(o);
                SelectedTabIndex = 2;
                OnPropertyChanged(nameof(CurrentUser));
            });
            OpenUrlProfileCommand = new RelayCommand(o => Process.Start($"https://steamcommunity.com/profiles/{o}").Dispose());
            RemoveFriendCommand = new RelayCommand(o =>
            {
                SteamRemoteClient.RemoveFriend((o as Friend).SteamID64);
                Friends.Remove(o as Friend);
                _needFriendsUpdate = true;
            });
            #endregion

            ApplyPrivacyCommand = new AsyncRelayCommand(async (o) =>
            {
                if (!await SteamRemoteClient.SetProfilePrivacy(CurrentUser.Privacy))
                {
                    Presentation.OpenPopupMessageBox("An error occurred while setting privacy settings...", true);
                }
            });

            RefreshTradeToken = new AsyncRelayCommand(async (o) =>
            {
                if(!await SteamRemoteClient.GetTradeToken(true))
                {
                    Presentation.OpenPopupMessageBox("An error occurred while refreshing the trade token...", true);
                }
                OnPropertyChanged(nameof(CurrentUser));
            });
        }

    }
}
