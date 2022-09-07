using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using SteamKit2;
using SteamKit2.Internal;
using Steam_Account_Manager.ViewModels.RemoteControl;
using Newtonsoft.Json;
using System.Windows.Threading;
using System.Net;

namespace Steam_Account_Manager.Infrastructure.Base
{
    public class RecentlyLoggedAccount
    {
        [JsonProperty("Username")]
        public string Username { get; set; }

        [JsonProperty("Loginkey")]
        public string Loginkey { get; set; }

        [JsonProperty("ImageUrl")]
        public string ImageUrl { get; set; }
    }
    public class User
    {
        [JsonProperty("Username")]
        public string Username { get; set; }

        [JsonProperty("Loginkey")]
        public string LoginKey { get; set; }

        [JsonProperty("SteamID64")]
        public string SteamID64 { get; set; }

        [JsonProperty("Games")]
        public List<Games> Games { get; set; }
    }
    public class Games
    {
        [JsonProperty("Name")]
        public string Name { get; set; }

        [JsonProperty("ImageURL")]
        public string ImageURL { get; set; }

        [JsonProperty("AppID")]
        public uint AppID { get; set; }

        [JsonProperty("Playtime_Forever")]
        public uint PlayTime_Forever { get; set; }
    }
    public class RootObject
    {
        public User RemoteUser { get; set; }
    }
 
    internal static class SteamRemoteClient
    {
        public static string UserPersonaName { get; private set; }
        public static SteamID InterlocutorID { get; set; }
        internal static EOSType OSType { get; private set; } = EOSType.Unknown;


        private static readonly CallbackManager      callbackManager;
        private static readonly SteamClient          steamClient;
        private static readonly SteamUser            steamUser;
        private static readonly SteamFriends         steamFriends;
        private static readonly GamesHandler         gamesHandler;
        private static readonly SteamUnifiedMessages steamUnified;
        

        private static string SteamGuardCode;
        private static string TwoFactorCode;
        private static string Username;
        private static string Password;
        private static string LoginKey;
        private static EResult LastLogOnResult;
        private static EPersonaState CurrentPersonaState;
        private static string CurrentSteamId64;


        public static bool IsRunning     { get; set; }
        public static RootObject CurrentUser { get; set; }

        internal const ushort CallbackSleep = 500; //milliseconds
        private const uint LoginID = 1488; // This must be the same for all processes
        //private const byte CaptchaLoginCooldown = 25; //minutes

        static SteamRemoteClient()
        {
            steamClient     = new SteamClient();
            gamesHandler    = new GamesHandler();
            callbackManager = new CallbackManager(steamClient);
            InterlocutorID  = new SteamID();

            steamUser    = steamClient.GetHandler<SteamUser>();
            steamFriends = steamClient.GetHandler<SteamFriends>();
            steamUnified = steamClient.GetHandler<SteamUnifiedMessages>();

            callbackManager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            callbackManager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);
            callbackManager.Subscribe<SteamUser.LoggedOnCallback>(OnLoggedOn);
            callbackManager.Subscribe<SteamUser.LoggedOffCallback>(OnLoggedOff);
            callbackManager.Subscribe<SteamUser.UpdateMachineAuthCallback>(OnMachineAuth);
            callbackManager.Subscribe<SteamUser.LoginKeyCallback>(OnLoginKey);

            callbackManager.Subscribe<SteamUser.AccountInfoCallback>(OnAccountInfo);
            callbackManager.Subscribe<SteamUser.WalletInfoCallback>(OnWalletInfo);
            callbackManager.Subscribe<SteamUser.EmailAddrInfoCallback>(OnEmailInfo);
            callbackManager.Subscribe<SteamFriends.PersonaStateCallback>(OnPersonaState);
            callbackManager.Subscribe<SteamFriends.PersonaChangeCallback>(OnPersonaNameChange);
            callbackManager.Subscribe<SteamFriends.FriendMsgCallback>(OnFriendMessage);

            steamClient.AddHandler(gamesHandler);

            if (!Directory.Exists(@".\Sentry"))
            {
                Directory.CreateDirectory(@".\Sentry");
            }

            SteamGuardCode = TwoFactorCode = null;

        }

        public static EResult Login(string username, string password, string authCode,string loginKey = null)
        {
            Username  = username;
            Password  = password;
            IsRunning = true;

            if (!Directory.Exists(@".\RemoteUsers"))
                Directory.CreateDirectory(@".\RemoteUsers");

            if(!string.IsNullOrEmpty(authCode))
            {
                if (LastLogOnResult == EResult.AccountLogonDenied)
                    SteamGuardCode = authCode;
                else if (LastLogOnResult == EResult.AccountLoginDeniedNeedTwoFactor || !String.IsNullOrEmpty(authCode))
                    TwoFactorCode = authCode;
            }
            if (!String.IsNullOrEmpty(LoginKey))
                LoginKey = loginKey;

            steamClient.Connect();

            while (IsRunning)
            {
                if (App.IsShuttingDown) Logout();
                callbackManager.RunWaitCallbacks(TimeSpan.FromMilliseconds(CallbackSleep));
            }

            return LastLogOnResult;
        }

        #region In file save
        private static void SerializeUser()
        {
            var ConvertedJson = JsonConvert.SerializeObject(CurrentUser, new JsonSerializerSettings
            {
                DefaultValueHandling = DefaultValueHandling.Populate,
                Formatting = Formatting.Indented
            });

            File.WriteAllText($@".\RemoteUsers\{Username}.json", ConvertedJson);
        }

        private static bool DeserializeUser()
        {
            if (File.Exists($@".\RemoteUsers\{Username}.json") && CurrentUser == null)
            {
                CurrentUser = JsonConvert.DeserializeObject<RootObject>(File.ReadAllText($@".\RemoteUsers\{Username}.json"));
                return true;
            }
            else if (CurrentUser.RemoteUser.Username == Username)
                return true;

            CurrentUser = new RootObject
            {
                RemoteUser = new User()
                {
                    Games = new List<Games>()
                }
            };

            SerializeUser();

            return false;
        } 
        #endregion

        public static void Logout()
        {
            LoginViewModel.SuccessLogOn = MainRemoteControlViewModel.IsPanelActive = false;
            
            SerializeUser();

            var ConvertedJson = JsonConvert.SerializeObject(LoginViewModel.RecentlyLoggedIn, new JsonSerializerSettings
            {
                DefaultValueHandling = DefaultValueHandling.Populate,
                Formatting = Formatting.Indented
            });
            File.WriteAllText(@".\RecentlyLoggedUsers.json", ConvertedJson);

            steamUser.LogOff();


            LastLogOnResult = EResult.NotLoggedOn;
        }

        #region Callbacks processing

        private static void OnConnected(SteamClient.ConnectedCallback callback)
        {
            if(DeserializeUser() && LoginKey == null)
            {
                LoginKey = CurrentUser.RemoteUser.LoginKey;
            }


            byte[] sentryHash = null;
            if(File.Exists(Username + ".bin"))
            {
                byte[] sentryFile = File.ReadAllBytes(Username + ".bin");
                sentryHash = CryptoHelper.SHAHash(sentryFile);
            }

            var logOnDetails = new SteamUser.LogOnDetails
            {
                Username               = Username,
                Password               = Password,
                AuthCode               = SteamGuardCode,
                TwoFactorCode          = TwoFactorCode,
                LoginID                = LoginID,
                ShouldRememberPassword = true,
                LoginKey               = LoginKey,
                SentryFileHash         = sentryHash,
            };

            if(OSType == EOSType.Unknown)
            {
                OSType = logOnDetails.ClientOSType;
            }

            steamUser.LogOn(logOnDetails);
        }

        private static void OnLoggedOn(SteamUser.LoggedOnCallback callback)
        {
            LastLogOnResult = callback.Result;

            if (LastLogOnResult == EResult.InvalidPassword && CurrentUser.RemoteUser.LoginKey != null)
            {
                CurrentUser.RemoteUser.LoginKey = null;
                LastLogOnResult = EResult.Cancelled;
            }
                

            if (LastLogOnResult != EResult.OK)
            {
                return;
            }

            Dispatcher.CurrentDispatcher.Invoke(() => LoginViewModel.AvatarStateOutline = Utilities.StringToBrush("Gray"));

            LoginViewModel.SteamId64 = steamClient.SteamID.ConvertToUInt64().ToString();
            CurrentSteamId64 = LoginViewModel.SteamId64;

            var parser = new Parsers.SteamParser(LoginViewModel.SteamId64);
            parser.ParsePlayerSummaries();
            LoginViewModel.ImageUrl = parser.GetAvatarUrlFull;
            GamesViewModel.Games = new System.Collections.ObjectModel.ObservableCollection<Games>(CurrentUser.RemoteUser.Games);

            if (CurrentUser.RemoteUser.SteamID64 == null)
                CurrentUser.RemoteUser.SteamID64 = LoginViewModel.SteamId64;

            LoginViewModel.IPCountryCode = callback.PublicIP + " | " + callback.IPCountryCode;

            MainRemoteControlViewModel.IsPanelActive = true;
            LoginViewModel.SuccessLogOn = true;
        }

        private static void OnLoggedOff(SteamUser.LoggedOffCallback callback)
        {
            LastLogOnResult = callback.Result;

            if (callback.Result.ToString() == "ServiceUnavailable")
            {
                steamClient.Disconnect();
            }
        }

        private static void OnDisconnected(SteamClient.DisconnectedCallback callback)
        {
            IsRunning = false;
        }

        private static void OnMachineAuth(SteamUser.UpdateMachineAuthCallback callback)
        {
            byte[] sentryHash = CryptoHelper.SHAHash(callback.Data);
            File.WriteAllBytes($@".\Sentry\{Username}.bin", callback.Data);

            steamUser.SendMachineAuthResponse(new SteamUser.MachineAuthDetails
            {
                JobID           = callback.JobID,
                FileName        = callback.FileName,
                BytesWritten    = callback.BytesToWrite,
                FileSize        = callback.Data.Length,
                Offset          = callback.Offset,
                Result          = EResult.OK,
                LastError       = 0,
                OneTimePassword = callback.OneTimePassword,
                SentryFileHash  = sentryHash
            });
        }

        private static void OnLoginKey(SteamUser.LoginKeyCallback callback)
        {
            steamUser.AcceptNewLoginKey(callback);
            if(CurrentUser.RemoteUser.Username == null)
                CurrentUser.RemoteUser.Username = Username;
            CurrentUser.RemoteUser.LoginKey = callback.LoginKey;

            for (int i = 0; i < LoginViewModel.RecentlyLoggedIn.Count; i++)
            {
                if (Username == LoginViewModel.RecentlyLoggedIn[i].Username)
                {
                    Application.Current.Dispatcher.Invoke(new Action(() => LoginViewModel.RecentlyLoggedIn[i] = new RecentlyLoggedAccount
                    {
                        Username = Username,
                        Loginkey = callback.LoginKey,
                        ImageUrl = LoginViewModel.ImageUrl
                    }));
                    return;
                }
            }

            Application.Current.Dispatcher.Invoke(new Action(() => LoginViewModel.RecentlyLoggedIn.Add(new RecentlyLoggedAccount
            {
                Username = Username,
                Loginkey = callback.LoginKey,
                ImageUrl = LoginViewModel.ImageUrl
            })));


        }

        private static void OnAccountInfo(SteamUser.AccountInfoCallback callback)
        {
            LoginViewModel.Nickname = UserPersonaName = callback.PersonaName;
            LoginViewModel.AuthedComputers = callback.CountAuthedComputers;
        }

        private static void OnEmailInfo(SteamUser.EmailAddrInfoCallback callback)
        {
          LoginViewModel.EmailAddress      = callback.EmailAddress;
          LoginViewModel.EmailVerification =  callback.IsValidated;
        }

        private static void OnWalletInfo(SteamUser.WalletInfoCallback callback)
        {
            if (callback.HasWallet)
            {
                LoginViewModel.Wallet =  (float.Parse(callback.LongBalance.ToString())/100).ToString("0.00", System.Globalization.CultureInfo.InvariantCulture);
                if (callback.Currency != ECurrencyCode.Invalid)
                    LoginViewModel.Wallet += " " + callback.Currency.ToString();
            }
            else
            {
                LoginViewModel.Wallet = "0.00 USD";
            }

            
        }

        private static void OnPersonaNameChange(SteamFriends.PersonaChangeCallback callback)
        {

            UserPersonaName = callback.Name;
        }

        private static void OnPersonaState(SteamFriends.PersonaStateCallback callback)
        {
            if(callback.FriendID == steamClient.SteamID)
            {
                if (CurrentPersonaState != callback.State)
                {
                    CurrentPersonaState = callback.State;
                    if (CurrentPersonaState == EPersonaState.Online)
                    {
                        Dispatcher.CurrentDispatcher.Invoke(() => LoginViewModel.AvatarStateOutline = Utilities.StringToBrush("#5da5c2"));
                    }
                    else if (callback.GameAppID != 0)
                    {
                        Dispatcher.CurrentDispatcher.Invoke(() => LoginViewModel.AvatarStateOutline = Utilities.StringToBrush("#688843"));
                    }
                    else if (CurrentPersonaState == EPersonaState.Away || CurrentPersonaState == EPersonaState.Snooze)
                    {
                        Dispatcher.CurrentDispatcher.Invoke(() => LoginViewModel.AvatarStateOutline = Utilities.StringToBrush("Orange"));
                    }
                    else
                        Dispatcher.CurrentDispatcher.Invoke(() => LoginViewModel.AvatarStateOutline = Utilities.StringToBrush("#666c71"));
                }

                if (LoginViewModel.Nickname != callback.Name)
                {
                    LoginViewModel.Nickname = callback.Name;
                }
            }
           
        }

        private static void OnFriendMessage(SteamFriends.FriendMsgCallback callback)
        {
           if (callback.Sender.AccountID == InterlocutorID.AccountID && callback.EntryType == EChatEntryType.ChatMsg)
            {
                Application.Current.Dispatcher.Invoke(new Action(() => MessagesViewModel.Messages.Add(new Message
                {
                    Msg       = callback.Message,
                    Time      = DateTime.Now.ToString("HH:mm"),
                    Username  = steamFriends.GetFriendPersonaName(callback.Sender),
                    TextBrush = (System.Windows.Media.Brush)App.Current.FindResource("default_foreground"),
                    MsgBrush  = (System.Windows.Media.Brush)App.Current.FindResource("second_main_color")
                })));
            }
        }

        #endregion

        public static void ChangeCurrentName(string Name)
        {
            steamFriends.SetPersonaName(Name);
        } 

        public static void ChangeCurrentPersonaState(EPersonaState state)
        {
            steamFriends.SetPersonaState(state);
        }

        public static void ChangePersonaFlags(uint uimode)
        {
            ClientMsgProtobuf<CMsgClientChangeStatus> requestPersonaFlag = new ClientMsgProtobuf<CMsgClientChangeStatus>(EMsg.ClientChangeStatus)
            {
                Body = { persona_state_flags = uimode }
            };
            steamClient.Send(requestPersonaFlag);
        }
        public static void UIMode(uint x)
        {
            ClientMsgProtobuf<CMsgClientUIMode> uiMode = new ClientMsgProtobuf<CMsgClientUIMode>(EMsg.ClientCurrentUIMode)
            {
                Body = { uimode = x }
            };
            steamClient.Send(uiMode);
        }
        
        public static void SendInterlocutorMessage(string Msg)
        {
            steamFriends.SendChatMessage(InterlocutorID, EChatEntryType.ChatMsg, Msg);

            Application.Current.Dispatcher.Invoke(new Action(() => MessagesViewModel.Messages.Add(new Message
            {
                Msg       = Msg,
                Time      = DateTime.Now.ToString("HH:mm"),
                Username  = LoginViewModel.Nickname,
                TextBrush = Utilities.StringToBrush("White"),
                MsgBrush  = (System.Windows.Media.Brush)App.Current.FindResource("menu_button_background")
            })));
        }

        public static SteamID FindFriendFromSteamID(uint steamID)
        {
            for (int i = 0; i < steamFriends.GetFriendCount(); i++)
            {
                if (steamFriends.GetFriendByIndex(i).AccountID == steamID)
                    return steamFriends.GetFriendByIndex(i);
            }
            return null;
        }

        #region Games parse
        public static async Task ParseOwnedGamesAsync()
        {
            string webApiKey = Keys.STEAM_API_KEY;
            if (!String.IsNullOrEmpty(Config._config.WebApiKey))
                webApiKey = Config._config.WebApiKey;

            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(
                "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" +
                webApiKey + "&steamid=" + CurrentSteamId64 + "&include_appinfo=true");

            CurrentUser.RemoteUser.Games = JsonConvert.DeserializeObject<RootObjectOwnedGames>(json).Response.Games;

            for (int i = 0; i < CurrentUser.RemoteUser.Games.Count; i++)
            {
                CurrentUser.RemoteUser.Games[i].ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{CurrentUser.RemoteUser.Games[i].AppID}/header.jpg";
            }
        }

        private class RootObjectOwnedGames
        {
            public ResponseOwnedGames Response { get; set; }
        }

        private class ResponseOwnedGames
        {
            public List<Games> Games { get; set; }
        } 

        #endregion

        internal static async Task IdleGame(uint? AppId,string GameName = null)
        {
            await gamesHandler.PlayGames(new HashSet<uint>(1) { AppId ?? 0 }, GameName).ConfigureAwait(false);
        }

        internal static async Task IdleGames(IReadOnlyCollection<uint> AppIds,string GameName = null)
        {
            if (AppIds == null || AppIds.Count == 0)
                throw new ArgumentNullException(nameof(AppIds));

            await gamesHandler.PlayGames(AppIds,GameName).ConfigureAwait(false);
        }

        internal static async Task StopIdle()
        {
            await gamesHandler.PlayGames(null).ConfigureAwait(false);
        }
    }
}
