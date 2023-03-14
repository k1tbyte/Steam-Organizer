using HtmlAgilityPack;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Steam_Account_Manager.Infrastructure.Converters;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using Steam_Account_Manager.Utils;
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
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient
{
    internal static class SteamRemoteClient
    {
        [System.Runtime.InteropServices.DllImport("PowrProf.dll", CharSet = System.Runtime.InteropServices.CharSet.Auto, ExactSpelling = true)]
        public static extern bool SetSuspendState(bool hiberate, bool forceCritical, bool disableWakeEvent);

        public static event Action UserStatusChanged;

        public static ulong InterlocutorID { get; set; }
        internal static EOSType OSType { get; private set; } = EOSType.Unknown;


        private static readonly CallbackManager callbackManager;
        private static readonly SteamClient steamClient;
        private static readonly SteamUser steamUser;
        private static readonly SteamFriends steamFriends;
        private static readonly GamesHandler gamesHandler;
        private static readonly WebHandler webHandler;

        private static readonly SteamUnifiedMessages.UnifiedService<IPlayer> UnifiedPlayerService;
        private static readonly SteamUnifiedMessages.UnifiedService<IEcon> UnifiedEcon;
        private static readonly SteamUnifiedMessages steamUnified;

        private static string SteamGuardCode;
        private static string TwoFactorCode;
        private static string Username;
        private static string Password;
        private static EResult LastLogOnResult;
        private static ulong CurrentSteamId64;
        private static string LoginKey;
        private static string WebApiUserNonce;


        public static bool IsRunning { get; set; }
        public static bool IsPlaying { get; set; }
        public static bool IsWebLoggedIn { get; private set; }
        public static User CurrentUser { get; set; }

        internal const ushort CallbackSleep = 500; //milliseconds
        private const uint LoginID = 1488; // This must be the same for all processes

        static SteamRemoteClient()
        {
            steamClient     = new SteamClient();
            gamesHandler    = new GamesHandler();
            callbackManager = new CallbackManager(steamClient);
            webHandler      = new WebHandler();

            steamUser       = steamClient.GetHandler<SteamUser>();
            steamFriends    = steamClient.GetHandler<SteamFriends>();

            steamUnified         = steamClient.GetHandler<SteamUnifiedMessages>();
            UnifiedPlayerService = steamUnified.CreateService<IPlayer>();
            UnifiedEcon          = steamUnified.CreateService<IEcon>();


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
            /*callbackManager.Subscribe<SteamGameCoordinator.MessageCallback>(OnCsgoMessage);*/

            steamClient.AddHandler(gamesHandler);

            if (!Directory.Exists($@"{App.WorkingDirectory}\Sentry"))
            {
                Directory.CreateDirectory($@"{App.WorkingDirectory}\Sentry");
            }

            SteamGuardCode = TwoFactorCode = null;

        }

        private static void RaiseUserStatusChanged()
        {
            if (UserStatusChanged == null) return;
            UserStatusChanged();
        }

        public static EResult Login(string username, string password, string authCode, string loginKey = null)
        {
            Username = username;
            Password = password;
            IsRunning = true;

            if (!Directory.Exists($@"{App.WorkingDirectory}\RemoteUsers"))
                Directory.CreateDirectory($@"{App.WorkingDirectory}\RemoteUsers");

            if (!Directory.Exists($@"{App.WorkingDirectory}\RemoteUsers\{Username}"))
                Directory.CreateDirectory($@"{App.WorkingDirectory}\RemoteUsers\{Username}");

            if (!Directory.Exists($@"{App.WorkingDirectory}\RemoteUsers\{Username}\ChatLogs"))
                Directory.CreateDirectory($@"{App.WorkingDirectory}\RemoteUsers\{Username}\ChatLogs");

            DeserializeUser();

            if (!string.IsNullOrEmpty(authCode))
            {
                if (LastLogOnResult == EResult.AccountLogonDenied)
                    SteamGuardCode = authCode;
                else if (LastLogOnResult == EResult.AccountLoginDeniedNeedTwoFactor)
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

        #region Cacheble
        private static void SerializeUser()
        {
            if (CurrentUser == null) 
                return;

            Utils.Common.BinarySerialize(CurrentUser, $"{App.WorkingDirectory}\\RemoteUsers\\{Username}\\User.dat");
        }

        private static void DeserializeUser()
        {
            string path = $"{App.WorkingDirectory}\\RemoteUsers\\{Username}\\User.dat";

            if (File.Exists(path) && CurrentUser == null)
            {
                CurrentUser = Utils.Common.BinaryDeserialize<User>(path);

            }
            else if (CurrentUser == null)
            {
                CurrentUser = new User();
                SerializeUser();
            }

            return;

            if (CurrentUser?.Messenger?.AdminID != null)
                MessagesViewModel.IsAdminIdValid = true;


            Application.Current.Dispatcher.Invoke(new Action(() =>
            {
                MessagesViewModel.EnableCommands = CurrentUser.Messenger.EnableCommands;
                MessagesViewModel.AdminId = CurrentUser.Messenger.AdminID.ToString();
                MessagesViewModel.SaveChatLog = CurrentUser.Messenger.SaveChatLog;
                MessagesViewModel.MsgCommands = new ObservableCollection<Command>(CurrentUser.Messenger.Commands);
                GamesViewModel.Games = new ObservableCollection<PlayerGame>(CurrentUser.Games);
                if (MainRemoteControlViewModel.MessagesV == null)
                    MainRemoteControlViewModel.MessagesV = new MVVM.View.RemoteControl.Controls.MessagesView();

                MessagesViewModel.InitDefaultCommands();

            }));

        }
        #endregion

        public static void Logout()
        {

            IsRunning =  LoginViewModel.SuccessLogOn = MainRemoteControlViewModel.IsPanelActive = false;            

            SerializeUser();

            Config.Serialize(LoginViewModel.RecentlyLoggedIn,App.WorkingDirectory + "\\RecentlyLoggedUsers.dat",Config.Properties.UserCryptoKey);

            steamUser.LogOff();
            CurrentUser = null;
            WebApiUserNonce = LoginKey = null;

            LastLogOnResult = EResult.NotLoggedOn;
        }

        #region Callbacks processing

        //FIXED
        private static void OnConnected(SteamClient.ConnectedCallback callback)
        {

            byte[] sentryHash = null;
            if (File.Exists($"{App.WorkingDirectory}\\Sentry\\{Username}.bin"))
            {
                byte[] sentryFile = File.ReadAllBytes($"{App.WorkingDirectory}\\Sentry\\{Username}.bin");
                sentryHash = CryptoHelper.SHAHash(sentryFile);
            }

            var logOnDetails = new SteamUser.LogOnDetails
            {
                Username = Username,
                Password = Password,
                AuthCode = SteamGuardCode,
                TwoFactorCode = TwoFactorCode,
                LoginID = LoginID,
                ShouldRememberPassword = true,
                LoginKey = LoginKey,
                SentryFileHash = sentryHash,
            };

            if (OSType == EOSType.Unknown)
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
                LoginKey        = null;
                LastLogOnResult = EResult.Cancelled;
            }
            if (LastLogOnResult != EResult.OK)
            {
                return;
            }

            CurrentUser.SteamID64      = steamClient.SteamID.ConvertToUInt64();
            CurrentUser.Username       = Username;
            CurrentUser.IPCountryCode  = callback.PublicIP.ToString();
            CurrentUser.IPCountryImage = $"https://flagcdn.com/w20/{callback.IPCountryCode.ToLower()}.png";
            ChangePersonaState(EPersonaState.Invisible);


            if (!String.IsNullOrEmpty(LoginKey))
            {
                steamUser.RequestWebAPIUserNonce();
            }

            WebApiUserNonce = callback.WebAPIUserNonce;

            MainRemoteControlViewModel.IsPanelActive = true;
            LoginViewModel.SuccessLogOn = true;

/*            if(CurrentUser.RememberGamesIds != null && CurrentUser.RememberGamesIds.Count > 0)
            {
                if(CurrentUser.RememberGamesIds.Count > 32)
                {
                    CurrentUser.RememberGamesIds = null;
                    return;
                }

                App.Current.Dispatcher.Invoke(new Action(async() =>
                {
                    if (MainRemoteControlViewModel.GamesV == null)
                        MainRemoteControlViewModel.GamesV = new MVVM.View.RemoteControl.Controls.GamesView();

                    MainRemoteControlViewModel.GamesV.rememberButton.IsChecked = true;

                    foreach (var item in CurrentUser.Games)
                    {
                        if (CurrentUser.RememberGamesIds.Contains(item.AppID))
                            MainRemoteControlViewModel.GamesV.games.SelectedItems.Add(item);
                    }

                    MainRemoteControlViewModel.GamesV.Idle.IsChecked = true;
                    await IdleGames(CurrentUser.RememberGamesIds);
                }));
            }*/

/*            steamClient.Send((IClientMsg)new ClientMsgProtobuf<CMsgClientGamesPlayed>(EMsg.ClientGamesPlayed)
            {
                Body = {
                games_played = {
                  new CMsgClientGamesPlayed.GamePlayed()
                  {
                    game_id = (ulong) new GameID(730UL)
                  }
                }
              }
            });

            gameCoordinator.Send((IClientGCMsg)new ClientGCMsgProtobuf<SteamKit2.GC.CSGO.Internal.CMsgClientHello>(4006U), 730U);*/

        }

        private static void OnLoggedOff(SteamUser.LoggedOffCallback callback)
        {
            LastLogOnResult = callback.Result;

            if (callback.Result == EResult.ServiceUnavailable)
            {
                steamClient.Disconnect();
            }
        }

        private static void OnDisconnected(SteamClient.DisconnectedCallback callback)
        {
            IsRunning = false;
        }

        //FIXED
        private static void OnMachineAuth(SteamUser.UpdateMachineAuthCallback callback)
        {
            byte[] sentryHash = CryptoHelper.SHAHash(callback.Data);
            File.WriteAllBytes($@"{App.WorkingDirectory}\Sentry\{Username}.bin", callback.Data);

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

        //NOT WORK
        private static void OnLoginKey(SteamUser.LoginKeyCallback callback)
        {
            //   LoginKey = callback.UniqueID.ToString();
            LoginKey = callback.LoginKey;
            steamUser.RequestWebAPIUserNonce();
            steamUser.AcceptNewLoginKey(callback);

            if(LoginViewModel.RecentlyLoggedIn.Exists(o => o.Username == Username,out int index))
            {
                Application.Current.Dispatcher.Invoke(() => LoginViewModel.RecentlyLoggedIn[index] = new RecentlyLoggedAccount
                {
                    Username = Username,
                    Loginkey = callback.LoginKey,
                    ImageUrl = CurrentUser.AvatarUrl
                });
            }
            else
            {
                Application.Current.Dispatcher.Invoke(() => LoginViewModel.RecentlyLoggedIn.Add(new RecentlyLoggedAccount
                {
                    Username = Username,
                    Loginkey = callback.LoginKey,
                    ImageUrl = CurrentUser.AvatarUrl
                }));
            }
            Config.Serialize(LoginViewModel.RecentlyLoggedIn,$"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
        }

        private static void OnWebApiUser(SteamUser.WebAPIUserNonceCallback callback)
        {
            if (callback.Result == EResult.OK && callback.Nonce != WebApiUserNonce)
            {
                WebApiUserNonce = callback.Nonce;
                UserWebLogOn();
            }
        }


        //FIXED
        private static void OnAccountInfo(SteamUser.AccountInfoCallback callback)
        {
            CurrentUser.Nickname        = callback.PersonaName;
            CurrentUser.AuthedComputers = callback.CountAuthedComputers;
        }

        //FIXED
        private static void OnEmailInfo(SteamUser.EmailAddrInfoCallback callback)
        {
            CurrentUser.EmailAddress    = callback.EmailAddress;
            CurrentUser.IsEmailVerified = callback.IsValidated;
        }

        //FIXED
        private static void OnWalletInfo(SteamUser.WalletInfoCallback callback)
        {
            if (callback.HasWallet && callback.LongBalance >= 0L)
            {
                CurrentUser.Wallet = (float.Parse(callback.LongBalance.ToString()) / 100f).ToString("0.00", System.Globalization.CultureInfo.InvariantCulture);
                if (callback.Currency != ECurrencyCode.Invalid)
                    CurrentUser.Wallet += " " + callback.Currency.ToString();
            }
            else
            {
                CurrentUser.Wallet = "0.00 USD";
            }

            RaiseUserStatusChanged();
        }

        //FIXED
        private static void OnPersonaNameChange(SteamFriends.PersonaChangeCallback callback)
        {
            CurrentUser.Nickname = callback.Name;
            RaiseUserStatusChanged();
        }

        //FIXED
        private static void OnPersonaState(SteamFriends.PersonaStateCallback callback)
        {
            if (callback.FriendID != steamClient.SteamID)
                return;

            bool flag = false;
            
            if(callback.State != (EPersonaState)CurrentUser.PersonaState)
            {
                CurrentUser._personaState = (int)callback.State;

                if (callback.GameAppID != 0)
                {
                    CurrentUser.PersonaStateBrush = Utils.Presentation.StringToBrush("#688843");
                }
                else if (callback.State == EPersonaState.Online || callback.State == EPersonaState.LookingToTrade || callback.State == EPersonaState.LookingToPlay)
                {
                    CurrentUser.PersonaStateBrush = Utils.Presentation.StringToBrush("#5da5c2");
                }
                else if (callback.State == EPersonaState.Away || callback.State == EPersonaState.Snooze)
                {
                    CurrentUser.PersonaStateBrush = System.Windows.Media.Brushes.Orange;
                }
                else
                    CurrentUser.PersonaStateBrush = Utils.Presentation.StringToBrush("#666c71");
                flag = true;
            }

            var hash = Utils.Common.ByteArrayToHexString(callback.AvatarHash);
            if (hash != CurrentUser.AvatarHash)
            {
                CurrentUser.AvatarHash = hash;
                flag = true;
            }


            if(flag)
              RaiseUserStatusChanged();
        }

        //FIXED
        private static async void OnFriendMessage(SteamFriends.FriendMsgCallback callback)
        {
            if (callback.EntryType != EChatEntryType.ChatMsg || callback.Message[0] != '/')
                return;

            var FriendPersonaName = steamFriends.GetFriendPersonaName(callback.Sender);
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

                            if (command.Length < 3)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/msg (CustomID,SteamID64,ID32,URL) (message)");
                                return;
                            }    
                                
                            var id = await SteamIDConverter.ToSteamID64(command[1]);
                            if(id == 0)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "🚧 Invalid ID!");
                                return;
                            }
                            steamFriends.SendChatMessage(id, EChatEntryType.ChatMsg, command[2]);
                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "💬 Message sent");
                            return;
                        case "/idle":
                            if (command.Length != 2)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/idle (AppID1 or AppID1,AppID2,AppID3...)");
                                return;
                            }

                            var appIds = Array.ConvertAll(command[1].Split(','), int.Parse);
                            if (appIds.Length == 1)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"⏳ Idling game: {appIds[0]}");
                                await IdleGame(appIds[0]);
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
                            if (command.Length != 2)
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
                                ChangePersonaState(state);
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"📣 State changed to: {state}");
                            }
                            return;
                    }

                    for (int i = 0; i < CurrentUser.Messenger.Commands.Count; i++)
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

            if (!CurrentUser.Messenger.SaveChatLog)
            {
                var SteamID64 = callback.Sender.ConvertToUInt64();
                var CleanName = System.Text.RegularExpressions.Regex.Replace(FriendPersonaName, "\\/:*?\"<>|", "");
                var FileName = $"[{SteamID64}] - {CleanName}.txt";
                var Message = $"{DateTime.Now} | {FriendPersonaName}: {callback.Message}\n";
                var Path = $@"{App.WorkingDirectory}\RemoteUsers\{Username}\ChatLogs\{FileName}";
                if (File.Exists(Path))
                {
                    File.AppendAllText(Path, Message);
                }
                else
                {
                    File.WriteAllText(Path, $" • 𝐂𝐡𝐚𝐭 𝐥𝐨𝐠 𝐰𝐢𝐭𝐡 𝐮𝐬𝐞𝐫 [{SteamID64}]\n\n" + Message);
                }
            }

            if (callback.Sender == InterlocutorID)
            {

                Application.Current.Dispatcher.Invoke(new Action(() => MessagesViewModel.Messages.Add(new Message
                {
                    Msg = callback.Message,
                    Time = DateTime.Now.ToString("HH:mm"),
                    Username = FriendPersonaName,
                    TextBrush = (System.Windows.Media.Brush)App.Current.FindResource("default_foreground"),
                    MsgBrush = (System.Windows.Media.Brush)App.Current.FindResource("second_main_brush")
                })));
            }
        }

/*        private static void OnCsgoMessage(SteamGameCoordinator.MessageCallback callback)
        {
            System.Action<IPacketGCMsg> action;
            if (!new Dictionary<uint, System.Action<IPacketGCMsg>>()
            {
                {
                   4004U,
                   new System.Action<IPacketGCMsg>(OnCSGOClientWelcome)
                },
                {
                   9128U,
                   new System.Action<IPacketGCMsg>(OnCSGODetails)
                }
            }.TryGetValue(callback.EMsg, out action))
                return;
            action(callback.Message);
        }*/

/*        private static void OnCSGOClientWelcome(IPacketGCMsg packetMsg)
        {
            ClientGCMsgProtobuf<SteamKit2.GC.CSGO.Internal.CMsgClientWelcome> clientGcMsgProtobuf = new ClientGCMsgProtobuf<SteamKit2.GC.CSGO.Internal.CMsgClientWelcome>(packetMsg);
            gameCoordinator.Send((IClientGCMsg)new ClientGCMsgProtobuf<CMsgGCCStrike15_v2_ClientRequestPlayersProfile>(9127U)
            {
                Body = {
                     account_id = (uint)(CurrentSteamId64 - 76561197960265728),
                     request_level = 32U
                       }
            }, 730U);
        }*/

/*        private static void OnCSGODetails(IPacketGCMsg packetMsg)
        {
            ClientGCMsgProtobuf<CMsgGCCStrike15_v2_PlayersProfile> clientGcMsgProtobuf = new ClientGCMsgProtobuf<CMsgGCCStrike15_v2_PlayersProfile>(packetMsg);
            var CSGOLevel = clientGcMsgProtobuf.Body.account_profiles[0].player_level;
            var CSGORank = clientGcMsgProtobuf.Body.account_profiles[0].ranking.rank_id.ToString();
            var CSGOWins = clientGcMsgProtobuf.Body.account_profiles[0].ranking.wins;
            var medals = clientGcMsgProtobuf.Body.account_profiles[0].medals;
            
        }*/

        #endregion

        public static void ChangeCurrentName(string Name)          => steamFriends.SetPersonaName(Name);
        public static void ChangePersonaState(EPersonaState state) =>  steamFriends.SetPersonaState(state);
        

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

/*            Application.Current.Dispatcher.Invoke(new Action(() => MessagesViewModel.Messages.Add(new Message
            {
                Msg = Msg,
                Time = DateTime.Now.ToString("HH:mm"),
                Username = LoginViewModel.Nickname,
                TextBrush = Utils.Presentation.StringToBrush("White"),
                MsgBrush = (System.Windows.Media.Brush)App.Current.FindResource("menu_button_background")
            })));*/
        }

        #region Friends parse

        public static async Task ParseUserFriends()
        {

            string webApiKey = Keys.STEAM_API_KEY;
            IEnumerable<JToken> sinces = null;
            if (!String.IsNullOrEmpty(Config.Properties.WebApiKey))
                webApiKey = Config.Properties.WebApiKey;

            try
            {
                var webClient = new WebClient { Encoding = Encoding.UTF8 };
                string json = await webClient.DownloadStringTaskAsync(
                    "http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?relationship=friend&key=" +
                    webApiKey + "&steamid=" + CurrentSteamId64);
                JToken node = JObject.Parse(json).SelectToken("*.friends");
                sinces = node.SelectTokens(@"$.[?(@.friend_since)].friend_since");
            }
            catch { }


            SteamID temp;
            string avatarTemp;

            for (int i = 0, j = 0; i < steamFriends.GetFriendCount(); i++)
            {
                temp = steamFriends.GetFriendByIndex(i);

                if (steamFriends.GetFriendRelationship(temp) != EFriendRelationship.Friend)
                    continue;

                avatarTemp = BitConverter.ToString(steamFriends.GetFriendAvatar(temp)).Replace("-", "");

                if (avatarTemp == "0000000000000000000000000000000000000000")
                {
                    avatarTemp = "fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb";
                }

                CurrentUser.Friends.Add(new Friend
                {
                    SteamID64 = temp.ConvertToUInt64(),
                    Name = steamFriends.GetFriendPersonaName(temp),
                    FriendSince = Utils.Common.UnixTimeToDateTime(ulong.TryParse(
                        sinces?.ElementAt(j).ToString(), out ulong result) ? result : 0)?.ToString("yyyy/MM/dd"), //REFACTOR STEAMID64
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

            Application.Current.Dispatcher.Invoke(() =>
            {
                if (CurrentUser.Games.Count != 0)
                {
                    CurrentUser.Games.Clear();
                }

                foreach (var game in result.games)
                {
                    CurrentUser.Games.Add(new PlayerGame
                    {
                        AppID = game.appid,
                        PlayTime_Forever = game.playtime_forever,
                        Name = game.name,
                        ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{game.appid}/header.jpg"
                    });
                }
            });

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

        internal static async Task<ObservableCollection<StatData>> GetAppAchievements(ulong gameID)
        {
            return new ObservableCollection<StatData>(await gamesHandler.GetAchievements(CurrentSteamId64, gameID).ConfigureAwait(false));
        }

        internal static async Task<bool> SetAppAchievements(ulong appID, IEnumerable<StatData> achievementsToSet)
        {
            return await gamesHandler.SetAchievements(CurrentSteamId64, appID, achievementsToSet);
        }
        #endregion

        internal static async Task<CPrivacySettings> GetProfilePrivacy()
        {

            var request = new CPlayer_GetPrivacySettings_Request { };

            var response = await UnifiedPlayerService.SendMessage(x => x.GetPrivacySettings(request)).ToTask().ConfigureAwait(false);
            return response.GetDeserializedResponse<CPlayer_GetPrivacySettings_Response>().privacy_settings;
        }


        #region Steam WEB
        private static void UserWebLogOn()
        {
            IsWebLoggedIn = webHandler.Authenticate(LoginKey, steamClient, WebApiUserNonce);
        }

        internal static async Task<bool> SetProfilePrivacy(int Profile, int Inventory, int Gifts, int OwnedGames, int Playtime, int Friends, int Comments)
        {
            if (!IsWebLoggedIn)
                return false;

            string response = null;
            await Task.Factory.StartNew(() =>
            {
                var ProfileSettings = new NameValueCollection
                {
                  { "sessionid", webHandler.SessionID },// Unknown,Private, FriendsOnly,Public
                    { "Privacy","{\"PrivacyProfile\":"+Profile+
                               ",\"PrivacyInventory\":" +Inventory+
                                ",\"PrivacyInventoryGifts\":"+Gifts+
                                 ",\"PrivacyOwnedGames\":"+OwnedGames+
                                ",\"PrivacyPlaytime\":"+Playtime+
                                 ",\"PrivacyFriendsList\":"+Friends+"}"},
                      { "eCommentPermission" ,Comments.ToString()
                  }//FriendsOnly,Public,Private
                };

                response = webHandler.Fetch("https://steamcommunity.com/profiles/" + CurrentSteamId64 + "/ajaxsetprivacy/", "POST", ProfileSettings);
            });

            if (!String.IsNullOrEmpty(response) && response.Contains("success\":1"))
            {
                return true;
            }
            else
            {
                Utils.Presentation.OpenPopupMessageBox(App.FindString("rc_lv_errorRequest"), true);
                return false;
            }

        }

        public static async Task GetWebApiKey()
        {
            if (!IsWebLoggedIn)
            {
                ManualWebConnect();
                return;
            }

            var responseResult = await Task.Factory.StartNew(() =>
            {
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(webHandler.Fetch("https://steamcommunity.com/dev/apikey?l=english", "GET"));

                if (htmlDoc?.DocumentNode == null)
                    return ESteamApiKeyState.Timeout;

                var TitleNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='mainContents']/h2");

                if (TitleNode == null)
                    return ESteamApiKeyState.Error;

                var Title = TitleNode.InnerText;

                if (String.IsNullOrEmpty(Title))
                    return ESteamApiKeyState.Error;
                else if (Title.Contains("Access Denied") || Title.Contains("Validated email address required"))
                    return ESteamApiKeyState.AccessDenied;

                var HtmlNode = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='bodyContents_ex']/p");

                if (HtmlNode == null)
                    return ESteamApiKeyState.Error;

                string text = HtmlNode.InnerText;

                if (String.IsNullOrEmpty(text))
                    return ESteamApiKeyState.Error;
                else if (text.Contains("Registering for a Steam Web API Key"))
                    return ESteamApiKeyState.NotRegisteredYet;

                CurrentUser.WebApiKey = text.Replace("Key: ", "");
                return ESteamApiKeyState.Registered;
            });

            if (responseResult == ESteamApiKeyState.Error || responseResult == ESteamApiKeyState.Timeout)
            {
                Utils.Presentation.OpenPopupMessageBox(App.FindString("rc_lv_errorRequest"), true);
                return;
            }

            switch (responseResult)
            {
                case ESteamApiKeyState.AccessDenied:
                    Utils.Presentation.OpenErrorMessageBox(App.FindString("rc_lv_apiKeyDeniedTip"),App.FindString("rc_lv_apiKeyDeniedTitle"));
                    return;
                case ESteamApiKeyState.NotRegisteredYet:
                    var response = Utils.Presentation.OpenQueryMessageBox(App.FindString("rc_lv_apiKeyNoRegTip"), App.FindString("rc_lv_apiKeyNoRegTitle"));
                    if (response == true)
                        RegisterWebApiKey();
                    return;
            }
        }

        internal static void RegisterWebApiKey()
        {
            var htmlDoc = new HtmlDocument();
            var data = new NameValueCollection
            {
                { "sessionid", webHandler.SessionID },
                { "agreeToTerms", "agreed" },
                { "domain", "autogenerated.localhost" },
                { "Submit", "Register" }
            };

            var response = webHandler.Fetch("https://steamcommunity.com/dev/registerkey", "POST", data);
            htmlDoc.LoadHtml(response);
            CurrentUser.WebApiKey = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='bodyContents_ex']/p")?.InnerText.Replace("Key: ", "");
        }

        internal static void ManualWebConnect()
        {
            if(Utils.Presentation.OpenQueryMessageBox(App.FindString("rc_lv_steamWebConnectTip"), App.FindString("rc_lv_notLogSteamWeb")) == true)
            {

            }
        }

        internal static async Task<bool> RevokeWebApiKey()
        {
            if (!IsWebLoggedIn)
            {
                ManualWebConnect();
                return false;
            }

            var htmlDoc = new HtmlDocument();
            var data = new NameValueCollection
            {
                { "sessionid", webHandler.SessionID },
                { "Revoke","Revoke My Steam Web API Key"}
            };

            var response = await webHandler.AsyncFetch("https://steamcommunity.com/dev/revokekey", "POST", data);

            if (!String.IsNullOrEmpty(response))
            {
                CurrentUser.WebApiKey = null;
                htmlDoc.LoadHtml(response);
                var HtmlNode = htmlDoc.DocumentNode.SelectSingleNode("//*[@id=\"message\"]/h3");
                if (HtmlNode != null && HtmlNode.InnerText.Contains("Unable to revoke API Key."))
                {
                    Utils.Presentation.OpenErrorMessageBox(App.FindString("rc_lv_apiKeyRevokeTip"), App.FindString("rc_lv_apiKeyRevokeTitle"));
                    return false;
                }
                return true;
            }
            Utils.Presentation.OpenPopupMessageBox(App.FindString("rc_lv_errorRequest"),true);
            return false;
        }

        internal static async Task<string> GetTradeToken(bool generateNew = false)
        {
            var request = new CEcon_GetTradeOfferAccessToken_Request
            {
                generate_new_token = generateNew,
            };

            var response = await UnifiedEcon.SendMessage(x => x.GetTradeOfferAccessToken(request)).ToTask().ConfigureAwait(false);
            if (response.Result != EResult.OK)
            {
                Utils.Presentation.OpenPopupMessageBox(App.FindString("rc_lv_errorRequest"),true);
                return null;
            }
            return response.GetDeserializedResponse<CEcon_GetTradeOfferAccessToken_Response>().trade_offer_access_token;
        }

        #endregion
    }
}
