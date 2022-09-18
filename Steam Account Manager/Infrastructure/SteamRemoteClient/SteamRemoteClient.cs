using HtmlAgilityPack;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.Validators;
using Steam_Account_Manager.Themes.MessageBoxes;
using Steam_Account_Manager.ViewModels.RemoteControl;
using SteamKit2;
using SteamKit2.Internal;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient
{
    internal static class SteamRemoteClient
    {
        [System.Runtime.InteropServices.DllImport("PowrProf.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto, ExactSpelling = true)]
        public static extern bool SetSuspendState(bool hiberate, bool forceCritical, bool disableWakeEvent);

        public static string UserPersonaName { get; private set; }
        public static ulong InterlocutorID   { get; set; }
        internal static EOSType OSType       { get; private set; } = EOSType.Unknown;


        private static readonly CallbackManager      callbackManager;
        private static readonly SteamClient          steamClient;
        private static readonly SteamUser            steamUser;
        private static readonly SteamFriends         steamFriends;
        private static readonly GamesHandler         gamesHandler;
        private static readonly WebHandler           webHandler;

        private static readonly SteamUnifiedMessages.UnifiedService<IPlayer> UnifiedPlayerService;
        private static readonly SteamUnifiedMessages.UnifiedService<IInventory> UnifiedInventory;
        private static readonly SteamUnifiedMessages steamUnified;

        private static string SteamGuardCode;
        private static string TwoFactorCode;
        private static string Username;
        private static string Password;
        private static EResult LastLogOnResult;
        private static EPersonaState CurrentPersonaState;
        private static ulong CurrentSteamId64;
        private static string LoginKey;
        private static string WebApiUserNonce;


        public static bool IsRunning     { get; set; }
        public static bool IsPlaying     { get; set; }
        public static bool IsWebLoggedIn { get; private set; }
        public static User CurrentUser   { get; set; }

        internal const ushort CallbackSleep = 500; //milliseconds
        private const uint LoginID = 1488; // This must be the same for all processes
        //private const byte CaptchaLoginCooldown = 25; //minutes

        static SteamRemoteClient()
        {
            steamClient     = new SteamClient();
            gamesHandler    = new GamesHandler();
            callbackManager = new CallbackManager(steamClient);
            webHandler      = new WebHandler();

            steamUser    = steamClient.GetHandler<SteamUser>();
            steamFriends = steamClient.GetHandler<SteamFriends>();

            steamUnified         = steamClient.GetHandler<SteamUnifiedMessages>();
            UnifiedPlayerService = steamUnified.CreateService<IPlayer>();
       //     UnifiedInventory     = steamUnified.CreateService<IInventory>();

            callbackManager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            callbackManager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);
            callbackManager.Subscribe<SteamUser.LoggedOnCallback>(OnLoggedOn);
            callbackManager.Subscribe<SteamUser.LoggedOffCallback>(OnLoggedOff);
            callbackManager.Subscribe<SteamUser.UpdateMachineAuthCallback>(OnMachineAuth);
            callbackManager.Subscribe<SteamUser.LoginKeyCallback>(OnLoginKey);
            callbackManager.Subscribe<SteamUser.WebAPIUserNonceCallback>(OnWebApiUser);

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

            if (!Directory.Exists($@".\RemoteUsers\{Username}"))
                Directory.CreateDirectory($@".\RemoteUsers\{Username}");
            
            if (!Directory.Exists($@".\RemoteUsers\{Username}\ChatLogs"))
                Directory.CreateDirectory($@".\RemoteUsers\{Username}\ChatLogs");

            DeserializeUser();

            if (!string.IsNullOrEmpty(authCode))
            {
                if (LastLogOnResult == EResult.AccountLogonDenied)
                    SteamGuardCode = authCode;
                else if (LastLogOnResult == EResult.AccountLoginDeniedNeedTwoFactor || !String.IsNullOrEmpty(authCode))
                    TwoFactorCode = authCode;
            }
            if (!String.IsNullOrEmpty(loginKey))
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

            File.WriteAllText($@".\RemoteUsers\{Username}\User.json", ConvertedJson);
        }

        private static void DeserializeUser()
        {
            bool state = false;
            if (File.Exists($@".\RemoteUsers\{Username}\User.json") && CurrentUser == null)
            {
                CurrentUser = JsonConvert.DeserializeObject<User>(File.ReadAllText($@".\RemoteUsers\{Username}\User.json"));

                state = true;
            }
            else if(CurrentUser == null)
            {
                CurrentUser = new User
                {
                    Games = new ObservableCollection<Game>(),
                    Friends = new ObservableCollection<Friend>(),
                    Messenger = new Messenger
                    {
                        Commands = new List<Command>()
                    }
                };

                SerializeUser();
                state = true;
            }
            
            if(state)
            {
                if (CurrentUser.Messenger.AdminID != null)
                    MessagesViewModel.IsAdminIdValid = true;
                MessagesViewModel.EnableCommands = CurrentUser.Messenger.EnableCommands;
                MessagesViewModel.AdminId = CurrentUser.Messenger.AdminID.ToString();
                MessagesViewModel.SaveChatLog = CurrentUser.Messenger.SaveChatLog;
                MessagesViewModel.MsgCommands = new ObservableCollection<Command>(CurrentUser.Messenger.Commands);

                Application.Current.Dispatcher.Invoke(new Action(() =>
                {
                    if (MainRemoteControlViewModel.MessagesV == null)
                        MainRemoteControlViewModel.MessagesV = new ViewModels.RemoteControl.View.MessagesView();

                    MessagesViewModel.InitDefaultCommands();

                }));
            }
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
            CurrentUser = null;
            WebApiUserNonce = LoginKey = null;

            LastLogOnResult = EResult.NotLoggedOn;
        }

        #region Callbacks processing

        private static void OnConnected(SteamClient.ConnectedCallback callback)
        {

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

            if (LastLogOnResult == EResult.InvalidPassword && LoginKey != null)
            {
                LoginKey = null;
                LastLogOnResult = EResult.Cancelled;
            }
                

            if (LastLogOnResult != EResult.OK)
            {
                return;
            }

            Dispatcher.CurrentDispatcher.Invoke(() => LoginViewModel.AvatarStateOutline = Utilities.StringToBrush("Gray"));

            CurrentSteamId64 = steamClient.SteamID.ConvertToUInt64();
            LoginViewModel.SteamId64 = CurrentSteamId64.ToString();

            var parser = new Parsers.SteamParser(LoginViewModel.SteamId64);
            parser.ParsePlayerSummaries();
            LoginViewModel.ImageUrl = parser.GetAvatarUrlFull;
            CurrentUser.Username = Username;

            if (CurrentUser.SteamID64 == null)
                CurrentUser.SteamID64 = LoginViewModel.SteamId64;
            
            if(!String.IsNullOrEmpty(LoginKey))
                steamUser.RequestWebAPIUserNonce();

            LoginViewModel.IPCountryCode = callback.PublicIP + " | " + callback.IPCountryCode;
            WebApiUserNonce              = callback.WebAPIUserNonce;

            MainRemoteControlViewModel.IsPanelActive = true;
            LoginViewModel.SuccessLogOn              = true;
            System.Windows.Forms.SendKeys.SendWait("{TAB}");
            
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
            CurrentUser.UniqueId = callback.UniqueID.ToString();
            UserWebLogOn();
            steamUser.RequestWebAPIUserNonce();
            steamUser.AcceptNewLoginKey(callback);
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

        private static void OnWebApiUser(SteamUser.WebAPIUserNonceCallback callback)
        {
            if (callback.Result == EResult.OK)
            {
                WebApiUserNonce = callback.Nonce;
                UserWebLogOn();
            }
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

        private static async void OnFriendMessage(SteamFriends.FriendMsgCallback callback)
        {
           if (callback.EntryType == EChatEntryType.ChatMsg)
            {
                var FriendPersonaName = steamFriends.GetFriendPersonaName(callback.Sender);
                if (callback.Message[0] == '/')
                {
                    var command = callback.Message.Split(' ');
                    var invalidCommand = "🚧 Invalid command!\n  Sample: ";

                    if (callback.Sender.AccountID == CurrentUser.Messenger.AdminID && CurrentUser.Messenger.EnableCommands)
                    {
                        try
                        {
                            switch (command[0])
                            {
                                case "/help":
                                    string outHelp = "🌌 Aviable commands 🌌\n";
                                    for (int i = 0; i < MessagesViewModel.MsgCommands.Count; i++)
                                    {
                                        outHelp += $"\n 🔹  {MessagesViewModel.MsgCommands[i].Keyword} ➖ {MessagesViewModel.MsgCommands[i].CommandExecution}";
                                    }
                                    steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, outHelp);
                                    return;
                                case "/shutdown":
                                    steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "🔌 App shutting down.");
                                    App.IsShuttingDown = true;
                                    App.Current.Dispatcher.InvokeShutdown();
                                    return;
                                case "/pcsleep":
                                    steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "💤 Sleeping...");
                                    SetSuspendState(false, true, true);
                                    return;
                                case "/pcshutdown":
                                    steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "🚩 Shutting down...");
                                    SerializeUser();
                                    Process.Start(new ProcessStartInfo("shutdown", "/s /t 0") { CreateNoWindow = true, UseShellExecute = false });
                                    return;
                                case "/msg":
                                    SteamValidator steamValidator;
                                    if (command.Length < 3)
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/msg (CustomID,SteamID64,ID32,URL) (message)");
                                    else
                                    {
                                        steamValidator = new SteamValidator(command[1]);
                                        if (steamValidator.GetSteamLinkType() != SteamValidator.SteamLinkTypes.ErrorType)
                                        {
                                            steamFriends.SendChatMessage(ulong.Parse(steamValidator.GetSteamId64()), EChatEntryType.ChatMsg, command[2]);
                                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "💬 Message sent");
                                        }
                                        else
                                        {
                                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "🚧 Invalid ID!");
                                        }
                                    }
                                    return;
                                case "/idle":
                                    if (command.Length != 2)
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/idle (AppID1 or AppID1,AppID2,AppID3...)");
                                    else
                                    {
                                        var appIds = Array.ConvertAll(command[1].Split(','), int.Parse);
                                        if (appIds.Length == 1)
                                        {
                                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"⏳ Idling game: {appIds[0]}");
                                            await IdleGame(appIds[0]);
                                        }
                                    }

                                    return;
                                case "/stopgame":
                                    if (IsPlaying)
                                    {
                                        await StopIdle();
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "❕ Game activity stopped");
                                    }
                                    else
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "❕ No games running");
                                    return;
                                case "/customgame":
                                    if(command.Length != 2)
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/customgame (Name)");
                                    else
                                    {
                                        await IdleGame(null, command[1]);
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"⏳ Game title setted: {command[1]}");
                                    }
                                    return;
                                case "/state":
                                    if (command.Length != 2)
                                    {
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/state (mode)\n\n" +
                                                                                   $"Modes\n 1 - Offline 🖥\n 2 - Online 📡\n 3 - Busy 🔍\n 4 - Away 👀\n 5 - Snooze 😴\n 6 - Looking to trade 🤖\n 7 - Looking to play 👾\n 8 - Invisible 👁‍");
                                    }
                                    else
                                    {
                                        var state = (EPersonaState)int.Parse(command[1]);
                                        ChangeCurrentPersonaState(state);
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"📣 State changed to: {state}");
                                    }
                                    return;
                                case "/achievements":
                                    if(command.Length != 2)
                                    {

                                    }
                                    else
                                    {

                                    }
                                    return;
                            }
                            for(int i = 0; i < CurrentUser.Messenger.Commands.Count; i++)
                            {
                                if (command[0] == CurrentUser.Messenger.Commands[i].Keyword)
                                {
                                    using (var process = new Process())
                                    {
                                        process.StartInfo.UseShellExecute = false;
                                        process.StartInfo.CreateNoWindow = true;
                                        process.StartInfo.FileName = "cmd";
                                        process.StartInfo.Arguments = "/c " + CurrentUser.Messenger.Commands[i].CommandExecution;
                                        process.Start();
                                    }
                                    if (CurrentUser.Messenger.Commands[i].MessageAfterExecute != "-")
                                        steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, CurrentUser.Messenger.Commands[i].MessageAfterExecute);
                                    break;
                                }
                            }
                        }
                        catch { steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "📛 An error has occurred!"); }
                    }
                    
                }


                if (CurrentUser.Messenger.SaveChatLog)
                {
                    var SteamID64 = callback.Sender.ConvertToUInt64();
                    var CleanName = System.Text.RegularExpressions.Regex.Replace(FriendPersonaName, "\\/:*?\"<>|", "");
                    var FileName = $"[{SteamID64}] - {CleanName}.txt";
                    var Message = $"{DateTime.Now} | {FriendPersonaName}: {callback.Message}\n";
                    var Path = $@".\RemoteUsers\{Username}\ChatLogs\{FileName}";
                    if (File.Exists(Path))
                    {
                        File.AppendAllText(Path, Message);
                    }
                    else
                    {
                        File.WriteAllText(Path, $" • 𝐂𝐡𝐚𝐭 𝐥𝐨𝐠 𝐰𝐢𝐭𝐡 𝐮𝐬𝐞𝐫 [{SteamID64}]\n\n" + Message);
                    }
                }

                if(callback.Sender == InterlocutorID)
                {
                    Application.Current.Dispatcher.Invoke(new Action(() => MessagesViewModel.Messages.Add(new Message
                    {
                        Msg = callback.Message,
                        Time = DateTime.Now.ToString("HH:mm"),
                        Username = FriendPersonaName,
                        TextBrush = (System.Windows.Media.Brush)App.Current.FindResource("default_foreground"),
                        MsgBrush = (System.Windows.Media.Brush)App.Current.FindResource("second_main_color")
                    })));
                }
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

        #region Friends parse
        
        public static async Task ParseUserFriends()
        {
            if (CurrentUser.Friends != null)
                CurrentUser.Friends.Clear();

            string webApiKey = Keys.STEAM_API_KEY;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                webApiKey = Config.Properties.WebApiKey;

            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(
                "http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?relationship=friend&key=" +
                webApiKey + "&steamid=" + CurrentSteamId64);
            JToken node = JObject.Parse(json).SelectToken("*.friends");
            var sinces = node.SelectTokens(@"$.[?(@.friend_since)].friend_since");
            
            SteamID temp;
            string avatarTemp;
            
            for (int i = 0,j = 0; i < steamFriends.GetFriendCount(); i++)
            {
                temp = steamFriends.GetFriendByIndex(i);

                if (steamFriends.GetFriendRelationship(temp) != EFriendRelationship.Friend)
                    continue;

                avatarTemp = BitConverter.ToString(steamFriends.GetFriendAvatar(temp)).Replace("-", "");

                if(avatarTemp == "0000000000000000000000000000000000000000")
                {
                    avatarTemp = "fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb";
                }

                CurrentUser.Friends.Add(new Friend
                {
                    SteamID64 = temp.ConvertToUInt64(),
                    Name = steamFriends.GetFriendPersonaName(temp),
                    FriendSince = Utilities.UnixTimeToDateTime(long.Parse(sinces.ElementAt(j).ToString())).ToString("yyyy/MM/dd"),
                    ImageURL = $"https://avatars.akamai.steamstatic.com/{avatarTemp}.jpg"
                });
                j++;
            }
        }

        #endregion

        internal static void RemoveFriend(ulong SteamID64)
        {
            steamFriends.RemoveFriend(SteamID64);
        }


        #region Games methods
        internal static async Task GetOwnedGames()
        {
            var request = new CPlayer_GetOwnedGames_Request
            {
                steamid = CurrentSteamId64,
                include_appinfo = true,
                include_free_sub = false,
                include_played_free_games = true
            };


            var response = await UnifiedPlayerService.SendMessage(x => x.GetOwnedGames(request)).ToTask().ConfigureAwait(false);

            var result = response.GetDeserializedResponse<CPlayer_GetOwnedGames_Response>();

            if (CurrentUser.Games.Count != 0)
            {
                CurrentUser.Games.Clear();
            }

            Application.Current.Dispatcher.Invoke(new Action(() =>
            {
                foreach (var game in result.games)
                {
                    CurrentUser.Games.Add(new Game
                    {
                        AppID = game.appid,
                        PlayTime_Forever = game.playtime_forever,
                        Name = game.name,
                        ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{game.appid}/header.jpg"
                    });
                }
            }));


        }

        internal static async Task IdleGame(int? AppId, string GameName = null)
        {
            if (IsPlaying)
                await gamesHandler.PlayGames(null).ConfigureAwait(false);
            await gamesHandler.PlayGames(new HashSet<int>(1) { AppId ?? 0 }, GameName).ConfigureAwait(false);
            IsPlaying = true;
        }

        internal static async Task IdleGames(IReadOnlyCollection<int> AppIds, string GameName = null)
        {
            if (AppIds == null || AppIds.Count == 0)
                throw new ArgumentNullException(nameof(AppIds));

            if (IsPlaying)
                await gamesHandler.PlayGames(null).ConfigureAwait(false);

            await gamesHandler.PlayGames(AppIds, GameName).ConfigureAwait(false);
            IsPlaying = true;
        }

        internal static async Task StopIdle()
        {
            await gamesHandler.PlayGames(null).ConfigureAwait(false);
            IsPlaying = false;
        } 
        #endregion


        internal static async void GetProfilePrivacy()
        {

            var request = new CPlayer_GetPrivacySettings_Request { };

            var response = await UnifiedPlayerService.SendMessage(x => x.GetPrivacySettings(request)).ToTask().ConfigureAwait(false);
            var result = response.GetDeserializedResponse<CPlayer_GetPrivacySettings_Response>();
        }


        #region Steam WEB
        private static void UserWebLogOn()
        {
            IsWebLoggedIn = webHandler.Authenticate(CurrentUser.UniqueId, steamClient, WebApiUserNonce);
        }

        internal static void SetProfiilePrivacy(byte Profile,byte Inventory, byte Gifts, byte OwnedGames,byte Playtime,byte Friends, byte Comments)
        {
            if (!IsWebLoggedIn)
                return;

            var ProfileSettings = new NameValueCollection
            {
                { "sessionid", webHandler.SessionID },// Unknown,Private, FriendsOnly,Public
                { "Privacy","{\"PrivacyProfile\":"+Profile+
                            ",\"PrivacyInventory\":" +Inventory+
                            ",\"PrivacyInventoryGifts\":"+Gifts+
                            ",\"PrivacyOwnedGames\":"+OwnedGames+
                            ",\"PrivacyPlaytime\":"+Playtime+
                            ",\"PrivacyFriendsList\":"+Friends+"}"},
                { "eCommentPermission" ,Comments.ToString()}//FriendsOnly,Public,Private
            };

            string response = webHandler.Fetch("https://steamcommunity.com/profiles/" + CurrentSteamId64 + "/ajaxsetprivacy/", "POST", ProfileSettings);
            if (response != String.Empty && response.Contains("success\":1"))
            {
                System.Windows.Forms.MessageBox.Show("Profile settings set!");
            }
        } 

        internal static async Task GetSteamWebApiKey()
        {
            if (!IsWebLoggedIn)
                return;

            var responseResult = await Task.Factory.StartNew(() =>
            {
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(webHandler.Fetch("https://steamcommunity.com/dev/apikey?l=english", "GET"));
                
                if(htmlDoc?.DocumentNode == null) 
                    return ESteamApiKeyState.Timeout;
                
                var TitleNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='mainContents']/h2");

                if(TitleNode == null)
                    return ESteamApiKeyState.Error;
               
                var Title = TitleNode.InnerText;

                if (String.IsNullOrEmpty(Title))
                    return ESteamApiKeyState.Error;
                else if(Title.Contains("Access Denied") || Title.Contains("Validated email address required"))
                    return ESteamApiKeyState.AccessDenied;

                var HtmlNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='bodyContents_ex']/p");

                if(HtmlNode == null)
                    return ESteamApiKeyState.Error;

                string text = HtmlNode.InnerText;

                if (String.IsNullOrEmpty(text))
                    return ESteamApiKeyState.Error;
                else if (text.Contains("Registering for a Steam Web API Key"))
                    return ESteamApiKeyState.NotRegisteredYet;

                CurrentUser.WebApiKey = text.Replace("Key: ","");
                return ESteamApiKeyState.Registered;
            });

            switch (responseResult)
            {
                case ESteamApiKeyState.Error:
                    new FlatMessageBox("An error occurred while getting the Web-API key");
                    return;
                case ESteamApiKeyState.Timeout:
                    new FlatMessageBox("Timeout exceeded...");
                    return;
                case ESteamApiKeyState.AccessDenied:
                    new FlatMessageBox("Access to Web API key denied");
                    return;
            }

        }

        #endregion
    }
}
