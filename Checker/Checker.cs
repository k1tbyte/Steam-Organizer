using SteamKit2;
using SteamKit2.Discovery;
using SteamKit2.Internal.Steamworks;
using SteamKit2.Internal;
using System;

namespace Steam_Account_Manager
{
    class Checker
    {

        CallbackManager  _callbackManager;
        SteamUser        _steamUser;
        SteamClient      _steamClient;

        string Username;
        string Password;

        public bool IsLoggedOn { get; private set; }
        public bool IsReadyForConnect { get; private set; }

        //User
        public string SteamID64 { get; private set; }

        public string Balance { get; private set; }

        //Email
        public string EmailAddress { get; private set; }
        public bool EmailIsValidated { get; private set; }

        public Checker(string username, string password)
        {
            IsLoggedOn = false;
            Username = username;
            Password = password;

            Init();
            RegCallbacks();
            Connect();
        }

        private void Init()
        {
            _steamClient = new SteamClient();
            _callbackManager = new CallbackManager(_steamClient);
            _steamUser = _steamClient.GetHandler<SteamUser>();
        }

        private void RegCallbacks()
        {
            _callbackManager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            _callbackManager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);

            _callbackManager.Subscribe<SteamUser.LoggedOnCallback>(OnLoggedOn);
            _callbackManager.Subscribe<SteamUser.LoggedOffCallback>(OnLoggedOff);

            _callbackManager.Subscribe<SteamUser.WalletInfoCallback>(OnAccountWallet);
            _callbackManager.Subscribe<SteamUser.EmailAddrInfoCallback>(OnAccountEmail);
            _callbackManager.Subscribe<SteamUser.AccountInfoCallback>(sus);
        }

        private void Connect()
        {
            _steamClient.Connect();
            IsReadyForConnect = true;
            Console.WriteLine("LOG | Connected to steam");
        }

        public void WaitForCallbacks()
        {
            _callbackManager.RunWaitAllCallbacks(TimeSpan.FromSeconds(1));
        }



        #region Callbacks


        #region Connect && login
        private void OnDisconnected(SteamClient.DisconnectedCallback disconnectedCallback)
        {
            Console.WriteLine("LOG | Disconnected from steam...");
            _steamClient.Disconnect();
            IsReadyForConnect = false;
        }

        private void OnLoggedOn(SteamUser.LoggedOnCallback loggedOnCallback)
        {
            bool IsSteamGuard = loggedOnCallback.Result == EResult.AccessDenied;
            bool Is2FA = loggedOnCallback.Result == EResult.AccountLoginDeniedNeedTwoFactor;

            if (IsSteamGuard)
            {
                Console.WriteLine("LOG | This account is SteamGuard protected!");
            }
            else if (Is2FA)
            {
                Console.WriteLine("LOG | This account is 2FA protected");
            }
            else if (loggedOnCallback.Result != EResult.OK)
            {
                Console.WriteLine("LOG | Unable to logon to Steam: {0} / {1}", loggedOnCallback.Result, loggedOnCallback.ExtendedResult);
            }
            else
            {
                Console.WriteLine("LOG | Successfully logged on.");
                SteamID64 = _steamUser.SteamID.ConvertToUInt64().ToString();
                Console.WriteLine("EMAIL DOMAIN " +  loggedOnCallback.EmailDomain);
                Console.WriteLine(loggedOnCallback.PublicIP);
                Console.WriteLine(loggedOnCallback.InGameSecsPerHeartbeat);
                Console.WriteLine(loggedOnCallback.IPCountryCode);
                Console.WriteLine(loggedOnCallback.VanityURL);
                Console.WriteLine(loggedOnCallback.WebAPIUserNonce);
                IsLoggedOn = true;

               // IsReadyForConnect = false;

            }
        }

        private void OnLoggedOff(SteamUser.LoggedOffCallback loggedOffCallback)
        {
            IsLoggedOn = false;
            Console.WriteLine("LOG | Logged off of Steam: {0}", loggedOffCallback.Result);
        }

        private void OnConnected(SteamClient.ConnectedCallback connectedCallback)
        {
            Console.WriteLine("LOG | Connected to Steam. Logging in '{0}'", Username);

            SteamUser.LogOnDetails Details = new SteamUser.LogOnDetails
            {
                Username = this.Username,
                Password = this.Password,
                TwoFactorCode = "2RPKD"
            };

            _steamUser.LogOn(Details);
        }
        #endregion

        private void OnAccountWallet(SteamUser.WalletInfoCallback walletInfoCallback)
        {
            Balance = walletInfoCallback.Balance.ToString();

            if (Balance[0] != '0')
                Balance = Balance.Insert(Balance.Length - 2, ",");
            if (Balance.Length != 1)
                Balance += " " + walletInfoCallback.Currency.ToString();
           // IsReadyForConnect = false;
        }

        private void OnAccountEmail(SteamUser.EmailAddrInfoCallback emailAddrInfoCallback)
        {
            EmailAddress = emailAddrInfoCallback.EmailAddress;
            EmailIsValidated = emailAddrInfoCallback.IsValidated;
        }

        private  void sus(SteamUser.AccountInfoCallback callback)
        {
            Console.WriteLine(callback.Country);
            Console.WriteLine(callback.AccountFlags);
            Console.WriteLine(callback.CountAuthedComputers);
            Console.WriteLine(callback.PersonaName);
        }



        #endregion

    }

    class def
    {
        public static void Main()
        {
            var checker = new Checker("D1lettantZz", "Andreyhackv3");
            while (checker.IsReadyForConnect)
            {
                checker.WaitForCallbacks();
            }
            Console.WriteLine("\n\nFINALLY: \n");
            Console.WriteLine("Balance: " + checker.Balance);
            Console.WriteLine("SteamID64: " + checker.SteamID64);
            Console.WriteLine("\n\nEMAIL STATUS:\n");
            Console.WriteLine("Address: " + checker.EmailAddress);
            Console.WriteLine("Is verified: " + checker.EmailIsValidated);
            Console.ReadKey();
        }
    }
}