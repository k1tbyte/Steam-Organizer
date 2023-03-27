using HtmlAgilityPack;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Steam_Account_Manager.Infrastructure.Converters;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.ViewModels;
using Steam_Account_Manager.Utils;
using SteamKit2;
using SteamKit2.Authentication;
using SteamKit2.Internal;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient
{
    internal static class SteamRemoteClient
    {
        public static event Action UserStatusChanged;
        public static event Action Connected;
        public static event Action<EResult> Disconnected;
        public static event Action<SteamChatMessage> SteamChatCallback;
        public static event Action<EAuthSessionGuardType> AuthenticationCallback;
        public static event Action<bool> GameSessionStateCallback;

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

        private static string Username;
        private static string Password;
        private static EResult LastLogOnResult;
        private static string WebApiUserNonce;


        public static bool IsRunning { get; set; }
        public static bool IsPlaying { get; set; }
        public static bool IsWebLoggedIn { get; private set; }
        public static User CurrentUser { get; set; }
        public static CredentialsAuthSession AuthSession { get; private set; }

        internal const ushort CallbackSleep = 500; //milliseconds
        private const uint LoginID          = 1488; // This must be the same for all processes
        private static RecentlyLoggedAccount RecentlyLogged;

        static SteamRemoteClient()
        {
            steamClient     = new SteamClient();
            gamesHandler    = new GamesHandler();
            callbackManager = new CallbackManager(steamClient);
            webHandler      = new WebHandler();

            steamUser     = steamClient.GetHandler<SteamUser>();
            steamFriends  = steamClient.GetHandler<SteamFriends>();
            steamUnified  = steamClient.GetHandler<SteamUnifiedMessages>();

            UnifiedPlayerService = steamUnified.CreateService<IPlayer>();
            UnifiedEcon          = steamUnified.CreateService<IEcon>();

            callbackManager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            callbackManager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);

            callbackManager.Subscribe<SteamUser.LoggedOnCallback>(OnLoggedOn);
            callbackManager.Subscribe<SteamUser.LoggedOffCallback>(OnLoggedOff);
            callbackManager.Subscribe<SteamUser.UpdateMachineAuthCallback>(OnMachineAuth);
            callbackManager.Subscribe<SteamUser.PlayingSessionStateCallback>(OnPlayingSessionState);
            callbackManager.Subscribe<SteamUser.AccountInfoCallback>(OnAccountInfo);
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
        }

        public static EResult Login(string username, string password)
        {
            Username        = username;
            Password        = password;
            IsRunning       = true;

            LastLogOnResult = EResult.NotLoggedOn;
            
            steamClient.Connect();
            
            while (IsRunning)
            {
                callbackManager.RunWaitCallbacks(TimeSpan.FromMilliseconds(CallbackSleep));
            }

            return LastLogOnResult;
        }

        #region Cacheble
        private static void DeserializeUser()
        {
            string path = $"{App.WorkingDirectory}\\RemoteUsers\\{Username}\\User.dat";
            if (File.Exists(path) && CurrentUser == null)
            {
                CurrentUser = Common.BinaryDeserialize<User>(path);
            }
            else if (CurrentUser == null)
            {
                CurrentUser = new User();
            }
        }
        #endregion

        #region Callbacks processing

        private static async void OnConnected(SteamClient.ConnectedCallback callback)
        {
            byte[] sentryHash = null;
            if (File.Exists($"{App.WorkingDirectory}\\Sentry\\{Username}.bin"))
            {
                byte[] sentryFile = File.ReadAllBytes($"{App.WorkingDirectory}\\Sentry\\{Username}.bin");
                sentryHash = CryptoHelper.SHAHash(sentryFile);
            }

            RecentlyLogged = RemoteControlViewModel.RecentlyLoggedIn.Find(o => o.Username == Username);
            (AuthPollResult, EResult) pollResponse = default;

            if (RecentlyLogged == null)
            {
                AuthSession = await steamClient.Authentication.BeginAuthSessionViaCredentialsAsync(new AuthSessionDetails
                {
                    Username = Username,
                    Password = Password,
                    IsPersistentSession = Config.Properties.RememberRemoteUser,
                }).ConfigureAwait(false);

                var authAcc = Config.Accounts.Find(o => o.Login == Username);
                if(AuthSession.AllowedConfirmations.Exists(o => o.confirmation_type == EAuthSessionGuardType.k_EAuthSessionGuardType_DeviceCode) && authAcc != null && !String.IsNullOrEmpty(authAcc.AuthenticatorPath) && System.IO.File.Exists(authAcc.AuthenticatorPath))
                {
                    try
                    {
                        await AuthSession.SendSteamGuardCodeAsync(
                      JsonConvert.DeserializeObject<SteamGuardAccount>(authAcc.AuthenticatorPath).GenerateSteamGuardCode(), EAuthSessionGuardType.k_EAuthSessionGuardType_DeviceCode);
                    }
                    catch { AuthenticationCallback(AuthSession.AllowedConfirmations[0].confirmation_type); }
                }
                else
                    AuthenticationCallback(AuthSession.AllowedConfirmations[0].confirmation_type);
                
                while (IsRunning)
                {
                    pollResponse = await AuthSession.PollAuthSessionStatusAsync().ConfigureAwait(false);
                    if (pollResponse.Item2 != EResult.OK)
                    {
                        LastLogOnResult = pollResponse.Item2;
                        steamClient.Disconnect();
                        return;
                    }
                    else if (pollResponse.Item1 != null) break;

                    await Task.Delay(500);
                }

                if (pollResponse.Item1 == null) return;

                if (Config.Properties.RememberRemoteUser)
                {
                    if (RemoteControlViewModel.RecentlyLoggedIn.Count == 6)
                        RemoteControlViewModel.RecentlyLoggedIn.RemoveAt(5);

                    RecentlyLogged = new RecentlyLoggedAccount { Username = Username, RefreshToken = pollResponse.Item1.RefreshToken };
                    App.Current.Dispatcher.Invoke(() => RemoteControlViewModel.RecentlyLoggedIn.Add(RecentlyLogged));
                    Config.Serialize(RemoteControlViewModel.RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
                }    
                    
            }

            steamUser.LogOn(new SteamUser.LogOnDetails
            {
                LoginID                = LoginID,
                SentryFileHash         = sentryHash,
                Username               = Username,
                AccessToken            = RecentlyLogged?.RefreshToken ?? pollResponse.Item1.RefreshToken
            });
        }

        private static void OnLoggedOn(SteamUser.LoggedOnCallback callback)
        {
            LastLogOnResult = callback.Result;

            if (LastLogOnResult != EResult.OK)
                return;

            if (!Directory.Exists($@"{App.WorkingDirectory}\RemoteUsers"))
                Directory.CreateDirectory($@"{App.WorkingDirectory}\RemoteUsers");

            if (!Directory.Exists($@"{App.WorkingDirectory}\RemoteUsers\{Username}"))
                Directory.CreateDirectory($@"{App.WorkingDirectory}\RemoteUsers\{Username}");

            if (!Directory.Exists($@"{App.WorkingDirectory}\RemoteUsers\{Username}\ChatLogs"))
                Directory.CreateDirectory($@"{App.WorkingDirectory}\RemoteUsers\{Username}\ChatLogs");


            var steamId = steamClient.SteamID.ConvertToUInt64();

            //  In order not to overwrite the same data, since with LoggedInElsewhere and RememberIdleGames
            //  the system will automatically re-login to the same account without clearing the session (Current user != null)
            //  In any other case, the session will be cleared and this will not happen.
            if (CurrentUser?.SteamID64 == steamId)
                return;

            DeserializeUser();

            CurrentUser.SteamID64      = steamId;
            CurrentUser.Username       = Username;
            CurrentUser.IPCountryCode  = callback.PublicIP.ToString();
            CurrentUser.IPCountryImage = $"https://flagcdn.com/w20/{callback.IPCountryCode.ToLower()}.png";
            
            ChangePersonaState(EPersonaState.Invisible);

            WebApiUserNonce = callback.WebAPIUserNonce;
            LoginIntoSteamWeb();

            Connected?.Invoke();

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

        private static void OnLoggedOff(SteamUser.LoggedOffCallback callback) => LastLogOnResult = callback.Result;
        public static void Logout()                                           => steamUser.LogOff();
        
        private static void OnDisconnected(SteamClient.DisconnectedCallback callback)
        {
            IsPlaying = IsRunning = false;
            WebApiUserNonce = null;
            Disconnected?.Invoke(LastLogOnResult);
        }

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

        private static async void LoginIntoSteamWeb()
        {
            if(webHandler.LastLogOnSteamID != CurrentUser.SteamID64 || !IsWebLoggedIn)
                IsWebLoggedIn = await webHandler.Initialize(steamClient, WebApiUserNonce);

            if(!IsWebLoggedIn)
            {
                System.Windows.Forms.MessageBox.Show("Не удалось подключиться к steamWeb");
            }

            if((DateTimeOffset.UtcNow.ToUnixTimeSeconds() - CurrentUser.CacheTimestamp) > 43200) //12 hours in seconds
            {
                await GetAccessToken();
                await GetWebApiKey();
                await GetTradeToken();
                CurrentUser.CacheTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }

            await GetLevel();
            await GetWalletInfo();
            await GetPointsBalance();
            UserStatusChanged?.Invoke();
        }

        private static void OnAccountInfo(SteamUser.AccountInfoCallback callback)
        {
            CurrentUser.Nickname        = callback.PersonaName;
            CurrentUser.AuthedComputers = callback.CountAuthedComputers;
        }

        private static void OnEmailInfo(SteamUser.EmailAddrInfoCallback callback)
        {
            CurrentUser.EmailAddress    = callback.EmailAddress;
            CurrentUser.IsEmailVerified = callback.IsValidated;
        }

        private static void OnPersonaNameChange(SteamFriends.PersonaChangeCallback callback)
        {
            if (CurrentUser.Nickname == callback.Name) return;
            CurrentUser.Nickname = callback.Name;
            UserStatusChanged?.Invoke();
        }

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

            if(hash != RecentlyLogged.AvatarHash)
            {
                RecentlyLogged.AvatarHash = hash;
                Config.Serialize(RemoteControlViewModel.RecentlyLoggedIn, $"{App.WorkingDirectory}\\RecentlyLoggedUsers.dat", Config.Properties.UserCryptoKey);
            }

            if(flag)
                UserStatusChanged?.Invoke();
        }

        private static async void OnFriendMessage(SteamFriends.FriendMsgCallback callback)
        {
            if (callback.EntryType != EChatEntryType.ChatMsg)
                return;

            var FriendPersonaName = steamFriends.GetFriendPersonaName(callback.Sender);
            var command = callback.Message.Split(' ');
            var invalidCommand = "🚧 Invalid command!\n  Sample: ";

            if (callback.Sender == CurrentUser.AdminID && CurrentUser.EnableCommands && callback.Message[0] == '/')
            {
                try
                {
                    switch (command[0].ToLower())
                    {
                        case "/help":
                            string outHelp = "🌌 Aviable commands 🌌\n";
                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, outHelp);
                            return;

                        case "/shutdown":
                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "🔌 Bot is shutting down.");
                            App.Current.Dispatcher.Invoke(() => App.Shutdown());
                            return;

                        case "/msg":
                            if (command.Length < 3)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/msg (CustomID,SteamID64,ID32,URL) (message)");
                                return;
                            }
                            var id = await SteamIDConverter.ToSteamID64(command[1]);
                            if (id == 0)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "🚧 Invalid ID!");
                                return;
                            }
                            steamFriends.SendChatMessage(id, EChatEntryType.ChatMsg, string.Join(" ",command.Skip(2)));
                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "💬 Message sent");
                            return;

                        case "/idle":
                            if(IsPlaying)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"🚧 At the moment the games are already running, use \"/stopplay\"");
                                return;
                            }
                            if (command.Length < 2)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/idle (AppID1 or AppID1,AppID2,AppID3...) ([optional] title)");
                                return;
                            }

                            var appIds = Array.ConvertAll(command[1].Split(','), int.Parse);
                            if(appIds.Length > 32)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"🚧 Maximum number of games: 32");
                                return;
                            }
                            if (appIds.Length > 0)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"⏳ Idling: {command[1]}");
                                await IdleGames(appIds,command.Length == 3 ? command[2] : null);
                                App.Current.Dispatcher.Invoke(() => ((App.MainWindow.DataContext as MainWindowViewModel).RemoteControlV?.DataContext as RemoteControlViewModel)?.ResetPlayingState(true));
                            }
                            return;

                        case "/stopplay":
                            if (IsPlaying)
                            {
                                await StopIdle();
                                App.Current.Dispatcher.Invoke(() => ((App.MainWindow.DataContext as MainWindowViewModel).RemoteControlV?.DataContext as RemoteControlViewModel)?.ResetPlayingState(false));
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "❕ Game activity stopped");
                            }
                            else
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "❕ No games running");
                            return;

                        case "/state":
                            if (command.Length != 2)
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/state (mode)\n\n" +
                                                                           $"Modes\n 1 - Offline 🖥\n 2 - Online 📡\n 3 - Busy 🔍\n 4 - Away 👀\n 5 - Snooze 😴\n 6 - Looking to trade 🤖\n 7 - Looking to play 👾\n 8 - Invisible 👁‍");
                                return;
                            }

                            if (int.TryParse(command[1], out int state) & --state >= 0 && state <= 7)
                            {
                                ChangePersonaState((EPersonaState)state);
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"📣 State changed to: {(EPersonaState)state}");
                            }
                            else
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"🚧 Failed to set state");
                            return;

                        case "/execute":
                            string mode;
                            if (command.Length < 3 || ((mode = command[1].ToLower()) != "powershell" && mode != "cmd"))
                            {
                                steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"{invalidCommand}/execute [(powershell) or (cmd)] (command)");
                                return;
                            }

                            Process.Start(new ProcessStartInfo {
                                UseShellExecute = false, 
                                CreateNoWindow = true,
                                Arguments = $"{(mode == "cmd" ? "/c " : "")}{string.Join(" ", command.Skip(2))}" ,
                                FileName = mode }).Dispose();

                            steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, $"⚙️ Command executed!");
                            return;
                    }
                }
                catch { steamFriends.SendChatMessage(callback.Sender, EChatEntryType.ChatMsg, "📛 An error has occurred!"); }
            }

            if (CurrentUser.SaveChatLog)
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

            if (callback.Sender == CurrentUser.InterlocutorID)
            {
                SteamChatCallback.Invoke(new SteamChatMessage { Message = callback.Message,Nickname = FriendPersonaName, Time= DateTime.Now.ToString("HH:mm"), IsSelf = false });
            }
        }

        private static void OnPlayingSessionState(SteamUser.PlayingSessionStateCallback callback)
        {
            GameSessionStateCallback?.Invoke(callback.PlayingBlocked);
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
                    ClientGCMsgProtobuf<CMsgGCCStr> clientGcMsgProtobuf = new ClientGCMsgProtobuf<CMsgGCCStrike15_v2_PlayersProfile>(packetMsg);
                    var CSGOLevel = clientGcMsgProtobuf.Body.account_profiles[0].player_level;
                    var CSGORank = clientGcMsgProtobuf.Body.account_profiles[0].ranking.rank_id.ToString();
                    var CSGOWins = clientGcMsgProtobuf.Body.account_profiles[0].ranking.wins;
                    var medals = clientGcMsgProtobuf.Body.account_profiles[0].medals;

                }*/

        #endregion

        public static void ChangeCurrentName(string Name)          => steamFriends.SetPersonaName(Name);
        public static void ChangePersonaState(EPersonaState state) =>  steamFriends.SetPersonaState(state);
        public static async Task GetLevel()
        {
            var request = new CPlayer_GetGameBadgeLevels_Request();

            var response = await UnifiedPlayerService.SendMessage(x => x.GetGameBadgeLevels(request)).ToTask().ConfigureAwait(false);
            CurrentUser.Level = response?.GetDeserializedResponse<CPlayer_GetGameBadgeLevels_Response>()?.player_level;
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
            steamFriends.SendChatMessage(CurrentUser.InterlocutorID, EChatEntryType.ChatMsg, Msg);
            SteamChatCallback.Invoke(new SteamChatMessage { IsSelf = true, Message = Msg, Nickname = CurrentUser.Nickname, Time = DateTime.Now.ToString("HH:mm") });
        }

        #region Friends parse
        public static async Task<ObservableCollection<Friend>> ParseUserFriends()
        {
            var friends = new ObservableCollection<Friend>();
            IEnumerable<JToken> sinces = null;

            using (var webClient = new WebClient { Encoding = Encoding.UTF8 })
            {
                var link = $"http://api.steampowered.com/ISteamUser/GetFriendList/v0001/?relationship=friend&key={(String.IsNullOrWhiteSpace(Config.Properties.WebApiKey) == true ? Keys.STEAM_API_KEY : Config.Properties.WebApiKey)}&steamid={CurrentUser.SteamID64}";
                string json = await Common.DownloadStringSync(link);
                JToken node = JObject.Parse(json)?.SelectToken("*.friends");
                sinces = node?.SelectTokens(@"$.[?(@.friend_since)].friend_since");
            }

            if (sinces == null) return null;

            for (int i = 0, j = 0; i < steamFriends.GetFriendCount(); i++)
            {
                SteamID temp = steamFriends.GetFriendByIndex(i);

                if (steamFriends.GetFriendRelationship(temp) != EFriendRelationship.Friend)
                    continue;

                string avatarTemp = BitConverter.ToString(steamFriends.GetFriendAvatar(temp)).Replace("-", "");

                if (avatarTemp.All(o => o == '0'))
                {
                    avatarTemp = "fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb";
                }

                friends.Add(new Friend
                {
                    SteamID64 = temp.ConvertToUInt64(),
                    Name = steamFriends.GetFriendPersonaName(temp),
                    FriendSince = Utils.Common.UnixTimeToDateTime(ulong.TryParse(
                        sinces?.ElementAt(j).ToString(), out ulong result) ? result : 0)?.ToString("yyyy/MM/dd"), //REFACTOR STEAMID64
                    ImageURL = $"https://avatars.akamai.steamstatic.com/{avatarTemp}.jpg"
                });
                j++;
            }

            return friends;
        }
        #endregion

        internal static void RemoveFriend(ulong SteamID64)
        {
            steamFriends.RemoveFriend(SteamID64);
        }

        #region Games methods
        internal static async Task<ObservableCollection<PlayerGame>> GetOwnedGames()
        {
            var request = new CPlayer_GetOwnedGames_Request
            {
                steamid = CurrentUser.SteamID64,
                include_appinfo = true,
                include_free_sub = false,
                include_played_free_games = true
            };

            var content = new ObservableCollection<PlayerGame>();
            var response = await UnifiedPlayerService.SendMessage(x => x.GetOwnedGames(request)).ToTask().ConfigureAwait(false);
            var result = response.GetDeserializedResponse<CPlayer_GetOwnedGames_Response>();

            foreach (var game in result.games)
            {
                content.Add(new PlayerGame
                {
                    AppID = game.appid,
                    PlayTime_Forever = game.playtime_forever / 60,
                    Name = game.name,
                    ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{game.appid}/header.jpg"
                });
            }
            return content;
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

        internal static async Task<List<StatData>> GetAppAchievements(ulong gameID)
        {
            return await gamesHandler.GetAchievements(CurrentUser.SteamID64, gameID).ConfigureAwait(false);
        }

        internal static async Task<bool> SetAppAchievements(int appID, IEnumerable<StatData> achievementsToSet)
        {
            return await gamesHandler.SetAchievements(CurrentUser.SteamID64, (ulong)appID, achievementsToSet);
        }
        #endregion

        internal static async Task<CPrivacySettings> GetProfilePrivacy()
        {

            var request = new CPlayer_GetPrivacySettings_Request { };

            var response = await UnifiedPlayerService.SendMessage(x => x.GetPrivacySettings(request)).ToTask().ConfigureAwait(false);
            return response.GetDeserializedResponse<CPlayer_GetPrivacySettings_Response>().privacy_settings;
        }

        #region Steam WEB

        internal static async Task<bool> SetProfilePrivacy(int Profile, int Inventory, int Gifts, int OwnedGames, int Playtime, int Friends, int Comments)
        {
            if (!IsWebLoggedIn)
                return false;

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

            string response = await webHandler.Fetch("https://steamcommunity.com/profiles/" + CurrentUser.SteamID64 + "/ajaxsetprivacy/", "POST", ProfileSettings);

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

        internal static async Task<bool> RevokeWebApiKey()
        {
            var htmlDoc = new HtmlDocument();
            var data = new NameValueCollection
            {
                { "sessionid", webHandler.SessionID },
                { "Revoke","Revoke My Steam Web API Key"}
            };

            var response = await webHandler.Fetch("https://steamcommunity.com/dev/revokekey", "POST", data);

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
        internal static async Task GetPointsBalance()
        {
            if (string.IsNullOrEmpty(CurrentUser.WebApiCachedAccessToken)) return;

            var arguments = new Dictionary<string, object>(2, StringComparer.Ordinal)
            {
                { "access_token", CurrentUser.WebApiCachedAccessToken },
                { "steamid", CurrentUser.SteamID64 }
            };

            KeyValue response;

            using (var iLoyaltyRewards = WebAPI.GetAsyncInterface("ILoyaltyRewardsService"))
            {
                iLoyaltyRewards.Timeout = TimeSpan.FromSeconds(100);

                response = await iLoyaltyRewards.CallAsync(HttpMethod.Get, "GetSummary", args: arguments).ConfigureAwait(false);
            }

            if (response == null)
                return;

            KeyValue pointsInfo = response["summary"]["points"];
            if (pointsInfo == KeyValue.Invalid)
                return;

            uint result = pointsInfo.AsUnsignedInteger(uint.MaxValue);

            if (result == uint.MaxValue)
                return;

            CurrentUser.Points = result;
        }

        internal static async Task GetWalletInfo()
        {
            var htmlDoc = new HtmlDocument();
            htmlDoc.LoadHtml(await webHandler.Fetch("https://store.steampowered.com/account/store_transactions?l=english", "GET"));

            if (htmlDoc.DocumentNode == null)
                return;

            CurrentUser.Wallet = htmlDoc.DocumentNode.SelectSingleNode("//*[@id=\"main_content\"]/div[2]/div[2]/div[1]/div[1]/div[1]/a")?.InnerText;
            CurrentUser.Region = htmlDoc.DocumentNode.SelectSingleNode("//*[@id=\"main_content\"]/div[2]/div[2]/div[3]/div/p/span")?.InnerText;
        }

        private static async Task GetAccessToken()
        {
            var response = await webHandler.Fetch("https://store.steampowered.com/pointssummary/ajaxgetasyncconfig", "GET");
            if (response == null)
                return;

            CurrentUser.WebApiCachedAccessToken = (string)JObject.Parse(response).SelectToken(".data")?.SelectToken(".webapi_token");
        }
        private static async Task GetWebApiKey()
        {
            var responseResult = await Task.Run(async () =>
            {
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(await webHandler.Fetch("https://steamcommunity.com/dev/apikey?l=english", "GET"));

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

            if (responseResult == ESteamApiKeyState.Error || responseResult == ESteamApiKeyState.Timeout || responseResult == ESteamApiKeyState.AccessDenied)
                return;

            else if (responseResult == ESteamApiKeyState.NotRegisteredYet)
            {
                if (Config.Properties.RegisterWebApiKeys)
                    RegisterWebApiKey();
            }


        }
        private static async void RegisterWebApiKey()
        {
            var htmlDoc = new HtmlDocument();
            var data = new NameValueCollection
            {
                { "sessionid", webHandler.SessionID },
                { "agreeToTerms", "agreed" },
                { "domain", "autogenerated.localhost" },
                { "Submit", "Register" }
            };

            var response = await webHandler.Fetch("https://steamcommunity.com/dev/registerkey", "POST", data);
            htmlDoc.LoadHtml(response);
            CurrentUser.WebApiKey = htmlDoc.DocumentNode.SelectSingleNode("//div[@id='bodyContents_ex']/p")?.InnerText?.Replace("Key: ", "");
        }
        internal static async Task GetTradeToken(bool generateNew = false)
        {
            var request = new CEcon_GetTradeOfferAccessToken_Request
            {
                generate_new_token = generateNew,
            };

            var response = await UnifiedEcon.SendMessage(x => x.GetTradeOfferAccessToken(request)).ToTask().ConfigureAwait(false);
            if (response.Result != EResult.OK)
                return;

            CurrentUser.TradeToken = response.GetDeserializedResponse<CEcon_GetTradeOfferAccessToken_Response>()?.trade_offer_access_token;
        }
        #endregion
    }
}
