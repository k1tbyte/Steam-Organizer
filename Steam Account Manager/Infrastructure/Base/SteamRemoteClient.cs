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

namespace Steam_Account_Manager.Infrastructure.Base
{
    internal static class SteamRemoteClient
    {
        #region User information

        public static string         SteamID64         { get; private set; }
        public static string         UserPersonaName   { get; private set; }
        public static string         UserCountry       { get; private set; }
        public static string         IPCountryCode     { get; private set; }
        public static string         UserWallet        { get; private set; }
        public static string         EmailAdress       { get; private set; }
        public static int            UserPersonaState  { get; private set; }
        public static bool           IsEmailValidated  { get; private set; }
        public static bool           IsUserPlaying     { get; private set; }
        public static List<SteamID>  Friends           { get; private set; }

        #endregion


        private static readonly CallbackManager      callbackManager;
        private static readonly SteamClient          steamClient;
        private static readonly SteamUser            steamUser;
        private static readonly SteamFriends         steamFriends;
        private static readonly GamesHandler         gamesHandler;
        private static readonly SteamUnifiedMessages steamUnified;

        private static string SteamGuardCode { get; set; }
        private static string TwoFactorCode  { get; set; }
        private static string Username;
        private static string Password;
        private static EResult LastLogOnResult;

        public static bool IsRunning     { get; set; }
        public static bool IsLoggedIn    { get; private set; }

        internal const ushort CallbackSleep = 500; //milliseconds
        private const byte CaptchaLoginCooldown = 25; //minutes

        static SteamRemoteClient()
        {
            steamClient     = new SteamClient();
            gamesHandler    = new GamesHandler();
            callbackManager = new CallbackManager(steamClient);

            steamUser    = steamClient.GetHandler<SteamUser>();
            steamFriends = steamClient.GetHandler<SteamFriends>();
            steamUnified = steamClient.GetHandler<SteamUnifiedMessages>();

            callbackManager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            callbackManager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);
            callbackManager.Subscribe<SteamUser.LoggedOnCallback>(OnLoggedOn);
            callbackManager.Subscribe<SteamUser.LoggedOffCallback>(OnLoggedOff);
            callbackManager.Subscribe<SteamUser.UpdateMachineAuthCallback>(OnMachineAuth);
         //   callbackManager.Subscribe<SteamUser.LoginKeyCallback>(OnLoginKey);

            callbackManager.Subscribe<SteamUser.AccountInfoCallback>(OnAccountInfo);
            callbackManager.Subscribe<SteamUser.WalletInfoCallback>(OnWalletInfo);
            callbackManager.Subscribe<SteamUser.EmailAddrInfoCallback>(OnEmailInfo);
            callbackManager.Subscribe<SteamFriends.PersonaStateCallback>(OnPersonaState);
            callbackManager.Subscribe<SteamFriends.PersonaChangeCallback>(OnPersonaNameChange);

            steamClient.AddHandler(gamesHandler);

            if (!Directory.Exists(@".\Sentry"))
            {
                Directory.CreateDirectory(@".\Sentry");
            }

            SteamGuardCode = TwoFactorCode = null;

        }

        public static EResult Login(string username, string password, string authCode)
        {
            Username  = username;
            Password  = password;
            IsRunning = true;

            if(!string.IsNullOrEmpty(authCode))
            {
                if (LastLogOnResult == EResult.AccountLogonDenied)
                    SteamGuardCode = authCode;
                else if (LastLogOnResult == EResult.AccountLoginDeniedNeedTwoFactor)
                    TwoFactorCode = authCode;
            }

            steamClient.Connect();

            while (IsRunning)
            {
                if (App.IsShuttingDown) Logout();
                callbackManager.RunWaitCallbacks(TimeSpan.FromMilliseconds(CallbackSleep));
                File.AppendAllText("container.txt", DateTime.Now + "\n");
            }

            return LastLogOnResult;
        }

        public static void Logout()
        {
            IsRunning = false;
            IsLoggedIn = false;
            steamUser.LogOff();

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

            steamUser.LogOn(new SteamUser.LogOnDetails
            {
                Username       = Username,
                Password       = Password,
                AuthCode       = SteamGuardCode,
                TwoFactorCode  = TwoFactorCode,
                SentryFileHash = sentryHash

            });
        }

        private static void OnLoggedOn(SteamUser.LoggedOnCallback callback)
        {
            LastLogOnResult = callback.Result;

            if(LastLogOnResult != EResult.OK)
            {
                return;
            }

            SteamID64     = steamClient.SteamID.ConvertToUInt64().ToString();
            IPCountryCode = callback.IPCountryCode;
            IsLoggedIn    = true;
            LoginViewModel.SuccessLogOn = true;

        }

        private static void OnLoggedOff(SteamUser.LoggedOffCallback callback)
        {
            LastLogOnResult = callback.Result;

            if (callback.Result.ToString() == "ServiceUnavailable")
            {
                steamClient.Disconnect();
            }

            IsLoggedIn = false;
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

        private static void OnAccountInfo(SteamUser.AccountInfoCallback callback)
        {
            UserPersonaName = callback.PersonaName;
            UserCountry     = callback.Country;
        }

        private static void OnEmailInfo(SteamUser.EmailAddrInfoCallback callback)
        {
            EmailAdress      = callback.EmailAddress;
            IsEmailValidated = callback.IsValidated;
        }

        private static void OnWalletInfo(SteamUser.WalletInfoCallback callback)
        {
            if (callback.HasWallet)
            {
               
            }
        }

        private static void OnPersonaNameChange(SteamFriends.PersonaChangeCallback callback)
        {
            UserPersonaName = callback.Name;
        }

        private static void OnPersonaState(SteamFriends.PersonaStateCallback callback)
        {

        }

        #endregion

    }
}
