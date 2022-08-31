using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Internal;

namespace Steam_Account_Manager.Infrastructure.Base
{
    internal static class SteamRemoteClient
    {
        #region User information

        public static string         SteamID64         { get; private set; }
        public static string         UserPersonaName   { get; private set; }
        public static string         UserCountry       { get; private set; }
        public static string         UserWallet        { get; private set; }
        public static int            UserPersonaState  { get; private set; }
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
        private static string TwoFactorCode { get; set; }
        private static string Username;
        private static string Password;

        public static bool IsRunning { get; set; }
        public static bool IsLoggedIn { get; private set; }


        static SteamRemoteClient()
        {
            steamClient = new SteamClient();
            gamesHandler = new GamesHandler();
            callbackManager = new CallbackManager(steamClient);

            steamUser = steamClient.GetHandler<SteamUser>();
            steamFriends = steamClient.GetHandler<SteamFriends>();
            steamUnified = steamClient.GetHandler<SteamUnifiedMessages>();

            callbackManager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            callbackManager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);
        }

        #region Callbacks processing

		private static void OnConnected(SteamClient.ConnectedCallback callback)
        {

        }

        private static void OnDisconnected(SteamClient.DisconnectedCallback callback)
        {

        }

	    #endregion

        public static void Login(string Username, string Password)
        {
            
        }
    }
}
