using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using SteamKit2;
using SteamKit2.Internal;
using Steam_Account_Manager.ViewModels.RemoteControl;
using Newtonsoft.Json;
using System.Windows.Threading;
using System.Net;
using System.Diagnostics;
using Steam_Account_Manager.Infrastructure.Validators;
using Steam_Account_Manager.Infrastructure.JsonModels;
using Newtonsoft.Json.Linq;
using System.Linq;

namespace Steam_Account_Manager.Infrastructure.Base
{
    internal static class SteamRemoteClient
    {
        [System.Runtime.InteropServices.DllImport("PowrProf.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto, ExactSpelling = true)]
        public static extern bool SetSuspendState(bool hiberate, bool forceCritical, bool disableWakeEvent);

        public static string UserPersonaName { get; private set; }
        public static ulong InterlocutorID { get; set; }
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
        private static EResult LastLogOnResult;
        private static EPersonaState CurrentPersonaState;
        private static string CurrentSteamId64;


        public static bool IsRunning     { get; set; }
        public static bool IsPlaying     { get; set; }
        public static User CurrentUser   { get; set; }

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
                CurrentUser.LoginKey = loginKey;

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

        private static bool DeserializeUser()
        {
            if (File.Exists($@".\RemoteUsers\{Username}\User.json") && CurrentUser == null)
            {
                CurrentUser = JsonConvert.DeserializeObject<User>(File.ReadAllText($@".\RemoteUsers\{Username}\User.json"));
                if (CurrentUser.Messenger.AdminID != null)
                    MessagesViewModel.IsAdminIdValid   = true;
                MessagesViewModel.EnableCommands       = CurrentUser.Messenger.EnableCommands;
                MessagesViewModel.AdminId              = CurrentUser.Messenger.AdminID.ToString();
                MessagesViewModel.SaveChatLog          = CurrentUser.Messenger.SaveChatLog;
                MessagesViewModel.MsgCommands          = new System.Collections.ObjectModel.ObservableCollection<Command>(CurrentUser.Messenger.Commands);
                FriendsViewModel.Friends               = new System.Collections.ObjectModel.ObservableCollection<Friend>(CurrentUser.Friends);

                Application.Current.Dispatcher.Invoke(new Action(() =>
                {
                    if (MainRemoteControlViewModel.MessagesV == null)
                        MainRemoteControlViewModel.MessagesV = new ViewModels.RemoteControl.View.MessagesView();

                    MessagesViewModel.InitDefaultCommands();
                }));
                


                return true;
            }
            else if (CurrentUser != null && CurrentUser.Username == Username)
                return true;

            CurrentUser = new User
            {
                Games = new List<Games>(),
                Friends = new List<Friend>(),
                Messenger = new Messenger
                {
                    Commands = new List<Command>()
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
            CurrentUser = null;

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
                LoginKey               = CurrentUser.LoginKey,
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

            if (LastLogOnResult == EResult.InvalidPassword && CurrentUser.LoginKey != null)
            {
                CurrentUser.LoginKey = null;
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
            GamesViewModel.Games = new System.Collections.ObjectModel.ObservableCollection<Games>(CurrentUser.Games);

            if (CurrentUser.SteamID64 == null)
                CurrentUser.SteamID64 = LoginViewModel.SteamId64;

            LoginViewModel.IPCountryCode = callback.PublicIP + " | " + callback.IPCountryCode;

            MainRemoteControlViewModel.IsPanelActive = true;
            LoginViewModel.SuccessLogOn = true;
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
            steamUser.AcceptNewLoginKey(callback);
            if(CurrentUser.Username == null)
                CurrentUser.Username = Username;
            CurrentUser.LoginKey = callback.LoginKey;

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
                                        var appIds = Array.ConvertAll(command[1].Split(','), uint.Parse);
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

        #region Games parse
        public static async Task ParseOwnedGamesAsync()
        {
            string webApiKey = Keys.STEAM_API_KEY;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                webApiKey = Config.Properties.WebApiKey;

            var webClient = new WebClient { Encoding = Encoding.UTF8 };
            string json = await webClient.DownloadStringTaskAsync(
                "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" +
                webApiKey + "&steamid=" + CurrentSteamId64 + "&include_appinfo=true");

            CurrentUser.Games = JsonConvert.DeserializeObject<RootObjectOwnedGames>(json).Response.Games;

            for (int i = 0; i < CurrentUser.Games.Count; i++)
            {
                CurrentUser.Games[i].ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{CurrentUser.Games[i].AppID}/header.jpg";
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

        internal static async Task IdleGame(uint? AppId,string GameName = null)
        {
            if(IsPlaying)
                await gamesHandler.PlayGames(null).ConfigureAwait(false);
            await gamesHandler.PlayGames(new HashSet<uint>(1) { AppId ?? 0 }, GameName).ConfigureAwait(false);
            IsPlaying = true;
        }

        internal static async Task IdleGames(IReadOnlyCollection<uint> AppIds,string GameName = null)
        {
            if (AppIds == null || AppIds.Count == 0)
                throw new ArgumentNullException(nameof(AppIds));

            if(IsPlaying)
                await gamesHandler.PlayGames(null).ConfigureAwait(false);

            await gamesHandler.PlayGames(AppIds,GameName).ConfigureAwait(false);
            IsPlaying = true;
        }

        internal static async Task StopIdle()
        {
            await gamesHandler.PlayGames(null).ConfigureAwait(false);
            IsPlaying = false;
        }
    }
}
