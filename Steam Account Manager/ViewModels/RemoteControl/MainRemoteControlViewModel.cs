using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.ViewModels.RemoteControl.View;
using System;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class MainRemoteControlViewModel : ObservableObject
    {
        public RelayCommand LoginViewCommand { get; set; }
        public RelayCommand GamesViewCommand { get; set; }
        public RelayCommand MessagesViewCommand { get; set; }
        public RelayCommand FriendsViewCommand { get; set; }
        public RelayCommand SteamWebViewCommand { get; set; }

        public static LoginViewModel LoginVm { get; private set; }
        public static GamesView GamesV { get; set; }
        public static FriendsView FriendsV { get; private set; }
        public static MessagesView MessagesV { get; set; }
        public static SteamWebView SteamWebV { get; private set; }

        private static bool _isPanelActive;
        public static event EventHandler IsPanelActiveChanged;
        public static bool IsPanelActive
        {
            get => _isPanelActive;
            set
            {
                _isPanelActive = value;
                IsPanelActiveChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static object _remoteControlCurrentView;
        public static event EventHandler RemoteControlCurrentViewChanged;
        public static object RemoteControlCurrentView
        {
            get => _remoteControlCurrentView;
            set
            {
                _remoteControlCurrentView = value;
                RemoteControlCurrentViewChanged?.Invoke(null, EventArgs.Empty);
            }
        }



        public MainRemoteControlViewModel()
        {
            LoginVm = new LoginViewModel();

            //  CurrentView = MessagesV;

            //  FriendsV = new FriendsView();
            // CurrentView = FriendsV;
            RemoteControlCurrentView = LoginVm;


            LoginViewCommand = new RelayCommand(o =>
            {
                if (o != null && o is int id)
                {
                    LoginVm.Username = Config.Accounts[id].Login;
                    LoginVm.Password = Config.Accounts[id].Password;
                    if (!String.IsNullOrEmpty(Config.Accounts[id].AuthenticatorPath))
                    {
                        LoginVm.AuthCode = Newtonsoft.Json.JsonConvert.DeserializeObject<SteamGuardAccount>(
                                System.IO.File.ReadAllText(Config.Accounts[id].AuthenticatorPath)).GenerateSteamGuardCode();
                    }
                    LoginVm.LogOnCommand.Execute(null);
                }

                if (RemoteControlCurrentView != LoginVm)
                    RemoteControlCurrentView = LoginVm;
            });

            GamesViewCommand = new RelayCommand(o =>
            {
                if (RemoteControlCurrentView != GamesV)
                {
                    if (GamesV == null)
                        GamesV = new GamesView();

                    RemoteControlCurrentView = GamesV;
                }
            });

            MessagesViewCommand = new RelayCommand(o =>
            {
                if (RemoteControlCurrentView != MessagesV)
                {
                    if (MessagesV == null)
                        MessagesV = new MessagesView();

                    RemoteControlCurrentView = MessagesV;
                }

            });

            FriendsViewCommand = new RelayCommand(o =>
            {
                if (RemoteControlCurrentView != FriendsV)
                {
                    if (FriendsV == null)
                        FriendsV = new FriendsView();

                    RemoteControlCurrentView = FriendsV;
                }
            });

            SteamWebViewCommand = new RelayCommand(o =>
            {
                if (RemoteControlCurrentView != SteamWebV)
                {
                    if (SteamWebV == null)
                        SteamWebV = new SteamWebView();

                    RemoteControlCurrentView = SteamWebV;
                }
            });
        }
    }
}
